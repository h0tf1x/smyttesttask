# -*- coding: utf-8 -*-
import os
from datetime import datetime

from django.test import TestCase
from schema import YamlSchema, YamlSchemaException, YamlTable, YamlField, FIELD_MAP


class YamlSchemaTestCase(TestCase):

    def setUp(self):
        self.valid_schema = """
users:
    title: Пользователи
    fields:
        - {id: name, title: Имя, type: char}     
        - {id: paycheck, title: Зарплата, type: int}
        - {id: date_joined, title: Дата поступления на работу, type: date}

    
rooms:
    title: Комнаты
    fields:
        - {id: department, title: Отдел, type: char}     
        - {id: spots, title: Вместимость, type: int}
"""
        self.not_valid_schema = """
users:
    title: Пользователи
    fields:
        - {id: name, title: Имя, type: string}
        - {id: paycheck, title: Зарплата, type: int}
        - {id: date_joined, title: Дата поступления на работу, type: date}
"""

    def test_valid_schema(self):
        schema = YamlSchema(yaml_string=self.valid_schema)
        self.assertEqual(len(schema.tables), 2)
        self.assertEqual(schema.get_table('users').title, u"Пользователи")
        self.assertEqual(len(schema.get_table('users').fields), 3)

    def test_not_valid_schema(self):
        with self.assertRaises(YamlSchemaException):
            schema = YamlSchema(yaml_string=self.not_valid_schema)


class YamlTableTestCase(TestCase):

    def test_table(self):
        table = YamlTable("tests", "title", [])
        self.assertEqual(len(table.fields), 0)
        self.assertEqual(table.name, 'tests')
        self.assertEqual(table.title, 'title')
        self.assertEqual(table.get_model_name(), "Test")


class YamlFieldTestCase(TestCase):

    def test_field(self):
        field = YamlField("num", "num", "int")
        django_field = field.to_django()
        self.assertIsNotNone(django_field)


class UsersTestCase(TestCase):

    def test_create(self):
        from app.models import User

        user = User(name="John", paycheck=1500, date_joined=datetime.now())
        user.save()

        user = User.objects.get(name="John")
        self.assertIsNotNone(user)
        self.assertEqual(user.paycheck, 1500)

        user.paycheck = 2000
        user.save()

        user = User.objects.get(name="John")
        self.assertIsNotNone(user)
        self.assertEqual(user.paycheck, 2000)

        user.delete()
        with self.assertRaises(User.DoesNotExist):
            user = User.objects.get(name="John")
