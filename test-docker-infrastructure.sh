#!/bin/bash

# 🧪 Docker Infrastructure Test Script
# This script tests all Docker services and security configurations

echo "🧪 Starting Docker Infrastructure Test..."
echo "=========================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results
TESTS_PASSED=0
TESTS_FAILED=0

print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((TESTS_PASSED++))
}

print_error() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((TESTS_FAILED++))
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# Function to test service health
test_service_health() {
    local service_name=$1
    local port=$2
    local path=$3
    
    print_test "Testing $service_name health on port $port"
    
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:$port$path" | grep -q "200\|301\|302"; then
        print_success "$service_name is responding correctly"
    else
        print_error "$service_name is not responding or returning error"
    fi
}

# Function to test MongoDB connection
test_mongodb() {
    print_test "Testing MongoDB connection and authentication"
    
    # Test if MongoDB is running
    if docker-compose -f docker-compose-new.yml exec -T mongodb mongosh --quiet --eval "db.runCommand('ping').ok" > /dev/null 2>&1; then
        print_success "MongoDB is running and accepting connections"
    else
        print_error "MongoDB connection failed"
        return
    fi
    
    # Test authentication
    if docker-compose -f docker-compose-new.yml exec -T mongodb mongosh --quiet -u signum_user -p signum_password --authenticationDatabase signum_db --eval "db.runCommand('ping').ok" > /dev/null 2>&1; then
        print_success "MongoDB authentication working"
    else
        print_error "MongoDB authentication failed"
    fi
    
    # Test database creation
    if docker-compose -f docker-compose-new.yml exec -T mongodb mongosh --quiet -u signum_user -p signum_password --authenticationDatabase signum_db --eval "use signum_db; db.test.insertOne({test: 'data'}); db.test.deleteOne({test: 'data'})" > /dev/null 2>&1; then
        print_success "MongoDB database operations working"
    else
        print_error "MongoDB database operations failed"
    fi
}

# Function to test Redis connection
test_redis() {
    print_test "Testing Redis connection and authentication"
    
    # Test if Redis is running
    if docker-compose -f docker-compose-new.yml exec -T redis redis-cli -a redis_secure_password ping | grep -q "PONG"; then
        print_success "Redis is running and authentication working"
    else
        print_error "Redis connection or authentication failed"
    fi
    
    # Test basic operations
    if docker-compose -f docker-compose-new.yml exec -T redis redis-cli -a redis_secure_password set test_key test_value > /dev/null 2>&1 && \
       docker-compose -f docker-compose-new.yml exec -T redis redis-cli -a redis_secure_password get test_key | grep -q "test_value"; then
        print_success "Redis operations working"
        docker-compose -f docker-compose-new.yml exec -T redis redis-cli -a redis_secure_password del test_key > /dev/null 2>&1
    else
        print_error "Redis operations failed"
    fi
}

# Function to test Nginx configuration
test_nginx() {
    print_test "Testing Nginx configuration and security headers"
    
    # Test if Nginx is running
    if curl -s -o /dev/null -w "%{http_code}" "http://localhost:80" | grep -q "200\|301\|302\|404"; then
        print_success "Nginx is running and responding"
    else
        print_error "Nginx is not responding"
        return
    fi
    
    # Test security headers
    local response_headers=$(curl -s -I "http://localhost:80" 2>/dev/null)
    
    if echo "$response_headers" | grep -qi "X-Content-Type-Options"; then
        print_success "X-Content-Type-Options header present"
    else
        print_error "X-Content-Type-Options header missing"
    fi
    
    if echo "$response_headers" | grep -qi "X-Frame-Options"; then
        print_success "X-Frame-Options header present"
    else
        print_error "X-Frame-Options header missing"
    fi
    
    if echo "$response_headers" | grep -qi "X-XSS-Protection"; then
        print_success "X-XSS-Protection header present"
    else
        print_error "X-XSS-Protection header missing"
    fi
    
    if echo "$response_headers" | grep -qi "Content-Security-Policy"; then
        print_success "Content-Security-Policy header present"
    else
        print_error "Content-Security-Policy header missing"
    fi
}

# Function to test application container
test_application() {
    print_test "Testing application container health"
    
    # Wait for application to be ready
    local max_attempts=30
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" "http://localhost:3000/health" | grep -q "200"; then
            print_success "Application is healthy and responding"
            break
        fi
        
        ((attempt++))
        if [ $attempt -eq $max_attempts ]; then
            print_error "Application health check timeout"
        else
            print_test "Waiting for application to be ready... (attempt $attempt/$max_attempts)"
            sleep 2
        fi
    done
}

# Function to test environment variables
test_environment() {
    print_test "Testing environment variables and secrets"
    
    if [ -f ".env" ]; then
        print_success ".env file exists"
        
        # Check for required variables
        local required_vars=("MONGODB_URI" "REDIS_URL" "SESSION_SECRET" "NODE_ENV")
        
        for var in "${required_vars[@]}"; do
            if grep -q "^${var}=" .env; then
                print_success "Environment variable $var is set"
            else
                print_error "Environment variable $var is missing"
            fi
        done
    else
        print_error ".env file not found"
    fi
}

# Function to test Docker network
test_docker_network() {
    print_test "Testing Docker network configuration"
    
    # Check if custom network exists
    if docker network ls | grep -q "signum_network"; then
        print_success "Custom Docker network 'signum_network' exists"
    else
        print_error "Custom Docker network 'signum_network' not found"
    fi
    
    # Test network connectivity between containers
    if docker-compose -f docker-compose-new.yml exec -T app ping -c 1 mongodb > /dev/null 2>&1; then
        print_success "Application can reach MongoDB container"
    else
        print_error "Application cannot reach MongoDB container"
    fi
    
    if docker-compose -f docker-compose-new.yml exec -T app ping -c 1 redis > /dev/null 2>&1; then
        print_success "Application can reach Redis container"
    else
        print_error "Application cannot reach Redis container"
    fi
}

# Function to test security configurations
test_security() {
    print_test "Testing security configurations"
    
    # Test for non-root user in containers
    local app_user=$(docker-compose -f docker-compose-new.yml exec -T app whoami 2>/dev/null)
    if [ "$app_user" != "root" ]; then
        print_success "Application container running as non-root user"
    else
        print_error "Application container running as root (security risk)"
    fi
    
    # Test MongoDB security
    if docker-compose -f docker-compose-new.yml exec -T mongodb mongosh --quiet --eval "db.runCommand('ping').ok" 2>&1 | grep -q "requires authentication"; then
        print_success "MongoDB requires authentication"
    else
        print_warning "MongoDB authentication status unclear"
    fi
    
    # Test file permissions
    print_test "Checking file permissions"
    
    local sensitive_files=(".env" "docker-compose-new.yml" "scripts/mongo-init.js")
    
    for file in "${sensitive_files[@]}"; do
        if [ -f "$file" ]; then
            local perms=$(stat -c "%a" "$file")
            if [[ "$perms" =~ ^[67][04][04]$ ]]; then
                print_success "File $file has secure permissions ($perms)"
            else
                print_warning "File $file permissions ($perms) could be more restrictive"
            fi
        fi
    done
}

# Function to test performance and resource usage
test_performance() {
    print_test "Testing resource usage and performance"
    
    # Check container resource usage
    local containers=("signum_app" "signum_mongodb" "signum_redis" "signum_nginx")
    
    for container in "${containers[@]}"; do
        if docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep -q "$container"; then
            local stats=$(docker stats --no-stream --format "{{.Container}}: CPU {{.CPUPerc}}, Memory {{.MemUsage}}" | grep "$container")
            print_success "Container $container: $stats"
        else
            print_error "Cannot get stats for container $container"
        fi
    done
}

# Function to test logging
test_logging() {
    print_test "Testing logging configuration"
    
    # Check if log directories exist and are writable
    local log_dirs=("./logs" "./nginx/logs")
    
    for log_dir in "${log_dirs[@]}"; do
        if [ -d "$log_dir" ] && [ -w "$log_dir" ]; then
            print_success "Log directory $log_dir exists and is writable"
        else
            print_warning "Log directory $log_dir missing or not writable"
        fi
    done
    
    # Test if containers are generating logs
    local containers=("app" "mongodb" "redis" "nginx")
    
    for container in "${containers[@]}"; do
        if docker-compose -f docker-compose-new.yml logs --tail=1 "$container" 2>/dev/null | grep -q "."; then
            print_success "Container $container is generating logs"
        else
            print_warning "Container $container has no recent logs"
        fi
    done
}

# Main test execution
main() {
    echo -e "${BLUE}🔍 Starting comprehensive Docker infrastructure tests...${NC}"
    echo ""
    
    # Check if docker-compose file exists
    if [ ! -f "docker-compose-new.yml" ]; then
        print_error "docker-compose-new.yml not found!"
        exit 1
    fi
    
    # Check if containers are running
    print_test "Checking if Docker containers are running"
    if docker-compose -f docker-compose-new.yml ps | grep -q "Up"; then
        print_success "Docker containers are running"
    else
        print_error "Docker containers are not running. Please start them first:"
        echo "docker-compose -f docker-compose-new.yml up -d"
        exit 1
    fi
    
    echo ""
    echo -e "${BLUE}📋 Running Infrastructure Tests${NC}"
    echo "--------------------------------"
    
    # Run all tests
    test_environment
    test_docker_network
    test_mongodb
    test_redis
    test_nginx
    test_application
    test_security
    test_performance
    test_logging
    
    echo ""
    echo -e "${BLUE}📊 Test Results Summary${NC}"
    echo "========================"
    
    local total_tests=$((TESTS_PASSED + TESTS_FAILED))
    local success_rate=0
    
    if [ $total_tests -gt 0 ]; then
        success_rate=$((TESTS_PASSED * 100 / total_tests))
    fi
    
    echo -e "Total Tests: $total_tests"
    echo -e "${GREEN}Passed: $TESTS_PASSED${NC}"
    echo -e "${RED}Failed: $TESTS_FAILED${NC}"
    echo -e "Success Rate: $success_rate%"
    
    if [ $TESTS_FAILED -eq 0 ]; then
        echo ""
        echo -e "${GREEN}🎉 All tests passed! Your Docker infrastructure is ready for production.${NC}"
        exit 0
    else
        echo ""
        echo -e "${RED}❌ Some tests failed. Please review the errors above.${NC}"
        echo -e "${YELLOW}💡 Check the README.md in the validators folder for troubleshooting.${NC}"
        exit 1
    fi
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "🧪 Docker Infrastructure Test Script"
        echo ""
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --help, -h    Show this help message"
        echo "  --quick, -q   Run only basic health checks"
        echo "  --security, -s Run only security tests"
        echo ""
        echo "This script tests all Docker services and security configurations."
        echo "Make sure to start the containers first:"
        echo "  docker-compose -f docker-compose-new.yml up -d"
        exit 0
        ;;
    --quick|-q)
        echo "🚀 Running quick health checks..."
        test_mongodb
        test_redis
        test_nginx
        test_application
        ;;
    --security|-s)
        echo "🔒 Running security tests..."
        test_security
        test_nginx
        ;;
    *)
        main
        ;;
esac
