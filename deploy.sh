#!/usr/bin/env bash
# Deploy Sourcing Sentinel (SPA + API) as ONE Cloud Run service in Tokyo.
# Builds from source (Dockerfile) via Cloud Build. Requires: gcloud auth, billing,
# and the run/aiplatform/cloudbuild/artifactregistry APIs enabled.
set -euo pipefail

PROJECT="${PROJECT:-tokyo-gemini-ai-hackathon}"
REGION="${REGION:-asia-northeast1}"
SERVICE="${SERVICE:-sourcing-sentinel}"
# Flip to false to use live FX/weather + search instead of the deterministic demo stubs.
USE_STUBS="${USE_STUBS:-true}"

gcloud run deploy "$SERVICE" \
  --source . \
  --project "$PROJECT" \
  --region "$REGION" \
  --allow-unauthenticated \
  --memory 1Gi \
  --cpu 1 \
  --timeout 600 \
  --set-env-vars "GOOGLE_GENAI_USE_VERTEXAI=TRUE,GOOGLE_CLOUD_PROJECT=${PROJECT},GOOGLE_CLOUD_LOCATION=${REGION},MODEL=gemini-3.5-flash,USE_STUBS=${USE_STUBS},FIRESTORE_DATABASE_ID=sourcingsentinel"

echo
echo "Deployed. Service URL:"
gcloud run services describe "$SERVICE" --project "$PROJECT" --region "$REGION" \
  --format="value(status.url)"
