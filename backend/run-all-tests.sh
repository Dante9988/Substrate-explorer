#!/bin/bash

echo "🧪 Blockchain Explorer Test Suite"
echo "=================================="
echo ""

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    yarn install
fi

# Function to run tests
run_tests() {
    local test_type=$1
    local pattern=$2
    local description=$3
    
    echo ""
    echo "🔍 Running $description..."
    echo "----------------------------------------"
    
    if yarn test --testPathPattern="$pattern" --verbose; then
        echo "✅ $description completed successfully!"
    else
        echo "❌ $description failed!"
        return 1
    fi
}

# Menu for test selection
echo "Choose test type:"
echo "1) Unit tests only (fast, mocked)"
echo "2) Integration tests only (live blockchain)"
echo "3) All tests (unit + integration)"
echo "4) Unit tests with coverage"
echo ""

read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo "🚀 Running unit tests only..."
        run_tests "unit" "^(?!.*integration)" "Unit Tests"
        ;;
    2)
        echo "🌐 Running integration tests only..."
        run_tests "integration" "integration" "Integration Tests"
        ;;
    3)
        echo "🚀 Running all tests..."
        run_tests "unit" "^(?!.*integration)" "Unit Tests"
        if [ $? -eq 0 ]; then
            run_tests "integration" "integration" "Integration Tests"
        fi
        ;;
    4)
        echo "📊 Running unit tests with coverage..."
        yarn test:cov --testPathPattern="^(?!.*integration)"
        ;;
    *)
        echo "❌ Invalid choice. Exiting."
        exit 1
        ;;
esac

echo ""
echo "🎉 Test suite completed!"
