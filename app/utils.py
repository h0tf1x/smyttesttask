# -*- coding: utf-8 -*-
import json
from django.http import HttpResponse


class JsonResponse(HttpResponse):

    def __init__(self, content, mimetype='application/json',
                 status=None, content_type=None):
        super(JsonResponse, self).__init__(
            content=json.dumps(content),
            mimetype=mimetype,
            status=status,
            content_type=content_type,
        )
