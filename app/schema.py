import os
import yaml

from django.db.models import *
import inflect

inflect_engine = inflect.engine()

FIELD_MAP = {
    'int': {'class': IntegerField, 'defaults': {}},
    'char': {'class': CharField, 'defaults': {'max_length': 255}},
    'date': {'class': DateField, 'defaults': {}}
}


class YamlSchemaException(Exception):
    pass


class YamlSchema(object):

    def __init__(self, yaml_file=None, yaml_string=None):
        instance = self
        self.tables = {}

        if yaml_file is not None and os.path.isfile(yaml_file):
            f = open(yaml_file, 'r')
            yaml_string = f.read()
            f.close()

        self.schema = yaml.load(yaml_string)
        if self.schema is None:
            raise YamlSchemaException("Not valid schema")

        for table_name, table_data in self.schema.iteritems():
            table = YamlTable(
                table_name, table_data['title'], table_data['fields'])
            self.tables[table_name] = table

    def register(self, module_name):
        for table in self.tables.values():
            table.register(module_name)

    def get_table(self, table_name):
        return self.tables.get(table_name, None)

    def get_model(self, table_name):
        table = self.tables.get(table_name, None)
        if table is not None:
            return table.model

    def to_list(self):
        output = []
        for table_name, table_data in self.schema.iteritems():
            table_data['id'] = table_name
            output.append(table_data)
        return list(output)


class YamlTable(object):

    def __init__(self, name, title, fields):
        self.name = name
        self.title = title
        self.fields = {}
        self.model = None

        for field in fields:
            f = YamlField(field['id'], field['title'], field['type'])
            self.fields[f.name] = f

    def register(self, module_name):
        if self.model is None:
            data = {
                '__module__': module_name,
            }
            for field in self.fields.values():
                data[field.name] = field.to_django()

            self.model = type(self.get_model_name(), (Model,), data)

        return self.model

    def get_model_name(self):
        model_name = inflect_engine.singular_noun(self.name)
        return model_name.capitalize()


class YamlField(object):

    def __init__(self, name, title, field_type):
        self.name = name
        self.title = title
        self.type = field_type
        if FIELD_MAP.get(self.type, None) is None:
            raise YamlSchemaException("Not supported field type")

    def to_django(self):
        field = FIELD_MAP.get(self.type, None)
        if field is not None:
            return field['class'](self.title, **field['defaults'])
        return None


instance = None
