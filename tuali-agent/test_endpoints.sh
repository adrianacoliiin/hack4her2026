#!/bin/bash
# test_endpoints.sh — Tuali Growth Agent
# Prueba los endpoints con pausas para respetar el rate limit de Gemini (15 RPM)

BASE_URL="http://localhost:3001"
CLIENTE_ACTIVO="7539780000000000000"
CLIENTE_NUEVO="307849000000000"
CLIENTE_BAJO="19286600000000000"
CEDIS="3816"
DELAY=5   # segundos entre requests con Gemini

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   Tuali Growth Agent — Tests         ║"
echo "╚══════════════════════════════════════╝"
echo "ℹ️  Pausas de ${DELAY}s entre tests para respetar rate limit de Gemini"

# ── TEST 1: Health check (sin llamada a Gemini) ──────────────────────────────
echo ""
echo "▶ TEST 1: Health check"
echo "────────────────────────"
curl -s "$BASE_URL/health" | python3 -m json.tool

# ── TEST 2: Chat cliente activo ───────────────────────────────────────────────
echo ""
echo "▶ TEST 2: Chat cliente ACTIVO — ¿qué pedir esta semana?"
echo "────────────────────────────────────────────────────────"
curl -s -X POST "$BASE_URL/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": $CLIENTE_ACTIVO,
    \"message\": \"¿Qué debería pedir esta semana para maximizar mis ganancias?\",
    \"goal\": \"Aumentar mi ticket promedio un 20%\"
  }" | python3 -m json.tool

echo "⏳ Esperando ${DELAY}s..."
sleep $DELAY

# ── TEST 3: Chat cliente nuevo ────────────────────────────────────────────────
echo ""
echo "▶ TEST 3: Chat cliente NUEVO — ¿por dónde empezar?"
echo "────────────────────────────────────────────────────"
curl -s -X POST "$BASE_URL/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": $CLIENTE_NUEVO,
    \"message\": \"Soy nuevo en Tuali, ¿qué productos me recomiendas?\",
    \"goal\": \"Aumentar mis ventas\"
  }" | python3 -m json.tool

echo "⏳ Esperando ${DELAY}s..."
sleep $DELAY

# ── TEST 4: Sustitutos ────────────────────────────────────────────────────────
echo ""
echo "▶ TEST 4: Chat — sustituto de Coca-Cola"
echo "────────────────────────────────────────"
curl -s -X POST "$BASE_URL/chat" \
  -H "Content-Type: application/json" \
  -d "{
    \"customer_id\": $CLIENTE_BAJO,
    \"message\": \"No me llegó la Coca-Cola, ¿qué puedo vender en su lugar?\",
    \"goal\": \"Mantener mis ventas estables\"
  }" | python3 -m json.tool

echo "⏳ Esperando ${DELAY}s..."
sleep $DELAY

# ── TEST 5: Insights proactivos ───────────────────────────────────────────────
echo ""
echo "▶ TEST 5: Insights proactivos — cliente ACTIVO"
echo "────────────────────────────────────────────────"
curl -s "$BASE_URL/insights/$CLIENTE_ACTIVO?goal=Aumentar+ventas+20%&cedis=$CEDIS" \
  | python3 -m json.tool

echo ""
echo "╔══════════════════════════════════════╗"
echo "║   ✅ Tests completados               ║"
echo "╚══════════════════════════════════════╝"