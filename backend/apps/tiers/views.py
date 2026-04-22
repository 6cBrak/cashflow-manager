from rest_framework import generics, filters
from rest_framework.permissions import IsAuthenticated
from .models import Tiers
from .serializers import TiersSerializer
from apps.authentication.permissions import IsAdmin


class TiersListCreateView(generics.ListCreateAPIView):
    serializer_class = TiersSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter]
    search_fields = ['nom']

    def get_queryset(self):
        qs = Tiers.objects.all()
        active_only = self.request.query_params.get('active', None)
        if active_only == 'true':
            qs = qs.filter(is_active=True)
        return qs


class TiersDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = TiersSerializer
    queryset = Tiers.objects.all()

    def get_permissions(self):
        if self.request.method in ('PUT', 'PATCH', 'DELETE'):
            return [IsAuthenticated()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        tiers = self.get_object()
        tiers.is_active = False
        tiers.save(update_fields=['is_active'])
        from rest_framework.response import Response
        return Response({'detail': 'Tiers désactivé.'})
