run:
	docker build -t andyhoang1994/ea-review-blog:1.0 .
	docker run -p 8000:8000 andyhoang1994/ea-review-blog:1.0
test:
	docker build -t andyhoang1994/ea-review-blog:1.0 .
	docker network create --gateway=172.0.0.1 --subnet=172.0.0.0/16 postman_tests
	docker run --network postman_tests --rm -d -p 8000:8000 andyhoang1994/ea-review-blog:1.0
	docker pull postman/newman
	docker run --network postman_tests -t postman/newman run "https://www.getpostman.com/collections/3cc7d607d391703a451d