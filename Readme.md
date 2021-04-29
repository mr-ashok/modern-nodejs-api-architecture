## Architecture

-   The architecture is divided into three main parts
    -   Data Layer
    -   Service Layer
    -   Middleware Layer

### Data Layer

-   The Data Layer is responsible for accessing the data.
-   It contains all the code for DB, Cache and external data resource.
-   The code inside this layer will only contains the logic for fetching/storing the data.

### Service Layer

-   This Layer is the brain of the artchitecture.
-   This layer contains the main logic of API endpoint.
-   This layer make use of Data Layer to fetch and store data.

### Middleware Layer

-   This layer is middleware between incomming request and the Service Layer.
-   The Middleware Layer contains the code to extract the data from request and provide the data to Service Layer. Also, it takes the result of Service Layer and pass it on as a response.
