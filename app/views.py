# -*- coding: utf-8 -*-
from django.shortcuts import render

from utils import JsonResponse
from models import schema


def index(request):
    return render(request, 'index.html')


def tables(request):
    return JsonResponse(schema.to_list())


def rows(request, table_name):
    table = schema.get_table(table_name)

    if table is None:
        return JsonResponse([])

    data = list(table.model.objects.values())
    return JsonResponse(data)
