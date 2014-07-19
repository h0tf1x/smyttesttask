from django.conf.urls import patterns, include, url

from django.contrib import admin

import views
from api import api
admin.autodiscover()

urlpatterns = patterns('',
    # Examples:
    url(r'^$', views.index, name='index'),
    url(r'^tables/', views.tables, name='tables'),
    url(r'^api/', include(api.urls)),
    url(r'^admin/', include(admin.site.urls)),
)
