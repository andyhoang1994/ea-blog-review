# EA Game Review Blog Site

## Overview
A blogging API that handles users, posts, and comments.

### How to Run
This is tested on:

`Docker` version 19.03.12

`Node` version 12.16.1

`yarn` version 1.22.0

Using `make`:
```
make run # To run the containerized blog
```
```
make test # To run tests on the API with Postman collections
```

Using just `Docker`:

Simply run the same commands as in the `Makefile`:

```
# To run the blog
docker build -t andyhoang1994/ea-review-blog:1.0 .
docker run -p 8000:8000 andyhoang1994/ea-review-blog:1.0
```
```
# To run the Postman tests
docker build -t andyhoang1994/ea-review-blog:1.0 .
docker network create --gateway=172.0.0.1 --subnet=172.0.0.0/16 postman_tests
docker run --network postman_tests --rm -d -p 8000:8000 andyhoang1994/ea-review-blog:1.0
docker pull postman/newman
docker run --network postman_tests -t postman/newman run "https://www.getpostman.com/collections/3cc7d607d391703a451d
```

Also available on Docker Hub without the tests:
```
docker pull andyhoang1994/ea-review-blog:1.0
```
## How it works
### Database
The database file can be found [here](./database/db.js)

The database is run on SQLite in memory so data will not persist across multiple loads.

### API Endpoints
Endpoint documentation can be found: https://app.swaggerhub.com/apis-docs/andyhoang8/blogPosts/1.0.0

And also [here](./swagger/api.yaml) in yaml format.

The code for the routes themselves can be found [here](./server/routes.js)

### Testing Pipeline
Whenever the project is pushed to github, it goes through a CircleCI pipeline.

Pipeline: https://app.circleci.com/pipelines/github/andyhoang1994/ea-review-blog/4/workflows/667a5327-19bb-4714-ba02-d836707d5cd6/jobs/6

Test results: https://app.circleci.com/pipelines/github/andyhoang1994/ea-review-blog/4/workflows/667a5327-19bb-4714-ba02-d836707d5cd6/jobs/6/parallel-runs/0/steps/0-109

This builds the container, tests it against a [Postman collection](https://www.getpostman.com/collections/3cc7d607d391703a451d) to ensure that all the APIs are working, and then pushes it to Docker Hub.

### Front-end
A basic frontend exists on localhost:8000

It is populated with mock data and is just meant to visualize the posts and comments with basic user data. The data is pulled from the database.
