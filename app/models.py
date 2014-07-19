# -*- coding: utf-8 -*-
import sys
from django.contrib import admin
import api

from settings import SCHEMA_FILE
from schema import YamlSchema, instance

self = sys.modules[__name__]

if instance is None:
    schema = YamlSchema(yaml_file=SCHEMA_FILE)
    schema.register(__name__)
    instance = schema
    for table_name, table in schema.tables.iteritems():
        setattr(self, table.get_model_name(), table.model)
        admin.site.register(table.model)
        api.register(table.name.lower(), table.model)

schema = instance
