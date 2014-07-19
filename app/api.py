# -*- coding: utf-8 -*-
from tastypie.api import Api
from tastypie.resources import ModelResource
from tastypie.authentication import Authentication
from tastypie.authorization import Authorization


class GuestAuthentication(Authentication):

    def is_authenticated(self, request, **kwargs):
        return True


class Meta(object):
    allowed_methods = ['get', 'post', 'put', 'delete']
    list_allowed_methods = ['get', 'post', 'put', 'delete']
    authentication = GuestAuthentication()
    authorization = Authorization()


def register(name, model):
    meta_fields = {'queryset': model.objects.all(),
                   'resource_name': name}
    meta_class = type('Meta', (Meta,), meta_fields)
    resource = type(model.__name__, (ModelResource,), {'Meta': meta_class})
    api.register(resource())

api = None

if api == None:
    api = Api(api_name='v1')
