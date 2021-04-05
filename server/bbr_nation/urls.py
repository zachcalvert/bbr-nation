from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers

from api import views

router = routers.DefaultRouter()
router.register(r'users', views.UserViewSet)
router.register(r'groups', views.GroupViewSet)
router.register(r'content', views.ContentViewSet)
router.register(r'pages', views.PageViewSet)
router.register(r'members', views.MemberViewSet)

router.register(r'players', views.PlayerViewSet)
router.register(r'playerseasons', views.PlayerSeasonViewSet)
router.register(r'seasons', views.SeasonViewSet)
router.register(r'teams', views.TeamViewSet)


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/', include(router.urls))
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)
