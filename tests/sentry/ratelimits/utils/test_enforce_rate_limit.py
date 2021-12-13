from django.conf.urls import url
from django.test import override_settings
from freezegun import freeze_time
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response

from sentry.api.base import Endpoint
from sentry.testutils import APITestCase
from sentry.types.ratelimit import RateLimit, RateLimitCategory


class RateLimitTestEndpoint(Endpoint):
    permission_classes = (AllowAny,)

    rate_limits = {"GET": {RateLimitCategory.IP: RateLimit(1, 100)}}

    def get(self, request):
        return Response({"ok": True})


class RateLimitEnforcedEndpoint(RateLimitTestEndpoint):
    enforce_rate_limit = True


class RateLimitUnenforcedEndpoint(RateLimitTestEndpoint):
    enforce_rate_limit = False


urlpatterns = [
    url(r"^/enforced$", RateLimitEnforcedEndpoint.as_view(), name="enforced-endpoint"),
    url(r"^/unenforced$", RateLimitUnenforcedEndpoint.as_view(), name="unenforced-endpoint"),
]


@override_settings(ROOT_URLCONF="tests.sentry.ratelimits.utils.test_enforce_rate_limit")
class EnforceRateLimitTest(APITestCase):
    def test_enforced_rate_limit(self):
        """Endpoints with enforce_rate_limit enabled should result in 429s"""
        self.endpoint = "enforced-endpoint"
        with freeze_time("2000-01-01"):
            self.get_success_response()
            self.get_error_response(status_code=status.HTTP_429_TOO_MANY_REQUESTS)

    def test_unenforced_rate_limit(self):
        """Endpoints with enforce_rate_limit disabled shouldn't reject requests"""
        self.endpoint = "unenforced-endpoint"
        with freeze_time("2000-01-01"):
            self.get_success_response()
            self.get_success_response()
