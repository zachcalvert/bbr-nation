from django.contrib import admin
from django.urls import include, path
from django.conf import settings
from django.conf.urls.static import static
from rest_framework import routers
from rest_framework_jwt.views import obtain_jwt_token

from api import views

router = routers.DefaultRouter()

# content
router.register(r'users', views.UserViewSet)
router.register(r'groups', views.GroupViewSet)
router.register(r'content', views.ContentViewSet)
router.register(r'pages', views.PageViewSet)
router.register(r'members', views.MemberViewSet)
router.register(r'sliders', views.ImageSliderViewSet)
router.register(r'images', views.ImageViewSet)

# football
router.register(r'players', views.PlayerViewSet)
router.register(r'playerseasons', views.PlayerSeasonViewSet)
router.register(r'seasons', views.SeasonViewSet)
router.register(r'teams', views.TeamViewSet)

# bbot
router.register(r'thoughts', views.ThoughtViewSet)



urlpatterns = [
    path('admin/', admin.site.urls),
    path('api-auth/', include('rest_framework.urls')),
    path('api/', include(router.urls)),
    path('token-auth/', obtain_jwt_token),
    path('current_user/', views.current_user),
    path('bot/', include('bot.urls')),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL,
                          document_root=settings.MEDIA_ROOT)

admin.site.site_header = "BBR Nation Admin"
admin.site.site_title = "BBR Nation Admin Portal"
admin.site.index_title = "BBR Nation Administration"
