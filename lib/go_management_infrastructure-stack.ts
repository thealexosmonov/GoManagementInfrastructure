import * as cdk from '@aws-cdk/core';
import * as ddb from "@aws-cdk/aws-dynamodb";
import {BillingMode} from "@aws-cdk/aws-dynamodb";
import * as lambda from "@aws-cdk/aws-lambda";
import * as apigateway from "@aws-cdk/aws-apigateway";
import {JsonSchemaType, JsonSchemaVersion} from "@aws-cdk/aws-apigateway";
import {Duration} from "@aws-cdk/core";


export class GoManagementInfrastructureStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    if (!process.env.ADMIN_SECRET_KEY) {
      throw new Error('Secret Admin Key Not Set!');
    }

    // using nosql, as getting a RDS cluster off the ground is substantially more code
    // separating into multiple ddb tables to mirror separation of data
    // user management table
    const userManagementTable = new ddb.Table(this, 'UserManagementTable', {
      tableName: 'UserManagementTable',
      partitionKey: {name: 'EMAIL_ADDRESS', type: ddb.AttributeType.STRING},
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true
    });

    // truck management table
    const truckManagementTable = new ddb.Table(this, 'TruckManagementTable', {
      tableName: 'TruckManagementTable',
      partitionKey: {name: 'VIN', type: ddb.AttributeType.STRING},
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true
    });

    // reservations management table
    const reservationManagementTable = new ddb.Table(this, 'ReservationManagementTable', {
      tableName: 'ReservationManagementTable',
      partitionKey: {name: 'RESERVATION_ID', type: ddb.AttributeType.STRING},
      billingMode: BillingMode.PAY_PER_REQUEST,
      pointInTimeRecovery: true
    });
    reservationManagementTable.addGlobalSecondaryIndex({
      indexName: 'vin-gsi',
      partitionKey: {name: 'VIN', type: ddb.AttributeType.STRING}
    });
    reservationManagementTable.addGlobalSecondaryIndex({
      indexName: 'email-gsi',
      partitionKey: {name: 'EMAIL_ADDRESS', type: ddb.AttributeType.STRING}
    });

    const goManagementSoftwareLambda = new lambda.Function(this, 'GoManagementSoftwareLambda', {
      runtime: lambda.Runtime.PYTHON_3_6,
      code: lambda.Code.fromAsset('./../GoManagementService/go_management_service.zip'),
      handler: 'handler.lambda_handler',
      environment: {
        'ADMIN_ACCESS_KEY': process.env.ADMIN_SECRET_KEY,
        'USERS_TABLE_NAME': userManagementTable.tableName,
        'TRUCK_TABLE_NAME': truckManagementTable.tableName,
        'RESERVATION_TABLE_NAME': reservationManagementTable.tableName
      },
    });

    // grant full ddb access to lambda
    userManagementTable.grantFullAccess(goManagementSoftwareLambda);
    truckManagementTable.grantFullAccess(goManagementSoftwareLambda);
    reservationManagementTable.grantFullAccess(goManagementSoftwareLambda);

    const goManagementSoftwareAPI = new apigateway.RestApi(this, 'GoManagementSoftwareAPI', {
      restApiName: 'Go Management Software API',
      description: 'API for Go Management Software',
      deploy: true
    });

    const requestValidator = goManagementSoftwareAPI.addRequestValidator('BasicRequestValidator', {
      validateRequestBody: true,
      validateRequestParameters: true,
    });

    const lambdaIntegration = new apigateway.LambdaIntegration(goManagementSoftwareLambda);

    // endpoint: /ping
    const pingEndpoint = goManagementSoftwareAPI.root.addResource('ping');
    pingEndpoint.addMethod('POST', lambdaIntegration);

    // endpoint: /user/update
    const userEndpoint = goManagementSoftwareAPI.root.addResource('user');
    const updateUserEndpoint = userEndpoint.addResource('update');
    const updateUserModel = goManagementSoftwareAPI.addModel('UpdateUserModel', {
      contentType: 'application/json',
      modelName: 'UpdateUserModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT7,
        title: 'UpdateUserModel',
        type: JsonSchemaType.OBJECT,
        properties: {
          email: {type: JsonSchemaType.STRING},
          firstName: {type: JsonSchemaType.STRING},
          lastName: {type: JsonSchemaType.STRING},
          phoneNumber: {type: JsonSchemaType.STRING},
          password: {type: JsonSchemaType.STRING},
          role: {type: JsonSchemaType.STRING},
          adminKey: {type: JsonSchemaType.STRING}
        },
        required: ['email', 'firstName', 'lastName', 'phoneNumber', 'role', 'password'],
      }
    });

    updateUserEndpoint.addMethod('POST', lambdaIntegration, {
      requestModels: {
        'application/json': updateUserModel,
      },
      requestValidator: requestValidator
    });

    // endpoint: /user/signin
    const signInUserEndpoint = userEndpoint.addResource('signin');
    const signInUserModel = goManagementSoftwareAPI.addModel('SignInUserModel', {
      contentType: 'application/json',
      modelName: 'SignInUserModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT7,
        title: 'SignInUserModel',
        type: JsonSchemaType.OBJECT,
        properties: {
          email: {type: JsonSchemaType.STRING},
          password: {type: JsonSchemaType.STRING},
        },
        required: ['email', 'password'],
      }
    });

    signInUserEndpoint.addMethod('POST', lambdaIntegration, {
      requestModels: {
        'application/json': signInUserModel,
      },
      requestValidator: requestValidator
    });


    // endpoint: /truck/update
    const truckEndpoint = goManagementSoftwareAPI.root.addResource('truck');
    const updateTruckEndpoint = truckEndpoint.addResource('update');
    const updateTruckModel = goManagementSoftwareAPI.addModel('UpdateTruckModel', {
      contentType: 'application/json',
      modelName: 'UpdateTruckModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT7,
        title: 'UpdateTruckModel',
        type: JsonSchemaType.OBJECT,
        properties: {
          vin: {type: JsonSchemaType.STRING},
          type: {type: JsonSchemaType.STRING},
        },
        required: ['vin', 'type'],
      }
    });

    updateTruckEndpoint.addMethod('POST', lambdaIntegration, {
      requestModels: {
        'application/json': updateTruckModel,
      },
      requestValidator: requestValidator
    });

    // endpoint: /truck/search
    const searchTrucksEndpoint = truckEndpoint.addResource('search');
    const searchTrucksModel = goManagementSoftwareAPI.addModel('SearchTrucksModel', {
      contentType: 'application/json',
      modelName: 'SearchTrucksModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT7,
        title: 'SearchTrucksModel',
        type: JsonSchemaType.OBJECT,
        properties: {
          type: {type: JsonSchemaType.STRING},
          startTime: {type: JsonSchemaType.NUMBER},
          endTime: {type: JsonSchemaType.NUMBER},
        },
        required: ['type', 'startTime', 'endTime'],
      }
    });

    searchTrucksEndpoint.addMethod('POST', lambdaIntegration, {
      requestModels: {
        'application/json': searchTrucksModel,
      },
      requestValidator: requestValidator
    });

    // endpoint: /reservation/list
    const reservationEndpoint = goManagementSoftwareAPI.root.addResource('reservation');
    const listReservationsEndpoint = reservationEndpoint.addResource("list")
    const listReservationsModel = goManagementSoftwareAPI.addModel('ListReservationsModel', {
      contentType: 'application/json',
      modelName: 'ListReservationsModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT7,
        title: 'ListReservationsModel',
        type: JsonSchemaType.OBJECT,
        properties: {
          email: {type: JsonSchemaType.STRING},
        },
        required: ['email'],
      }
    });

    listReservationsEndpoint.addMethod('POST', lambdaIntegration, {
      requestModels: {
        'application/json': listReservationsModel,
      },
      requestValidator: requestValidator
    });

    // endpoint: /reservation/book
    const bookReservationEndpoint = reservationEndpoint.addResource("book")
    const bookReservationModel = goManagementSoftwareAPI.addModel('BookReservationModel', {
      contentType: 'application/json',
      modelName: 'BookReservationModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT7,
        title: 'BookReservationModel',
        type: JsonSchemaType.OBJECT,
        properties: {
          vin: {type: JsonSchemaType.STRING},
          type: {type: JsonSchemaType.STRING},
          email: {type: JsonSchemaType.STRING},
          startTime: {type: JsonSchemaType.NUMBER},
          endTime: {type: JsonSchemaType.NUMBER},
        },
        required: ['vin', 'startDate', 'endDate', 'email', 'type'],
      }
    });

    bookReservationEndpoint.addMethod('POST', lambdaIntegration, {
      requestModels: {
        'application/json': bookReservationModel,
      },
      requestValidator: requestValidator
    });


    // endpoint: /reset
    const resetEndpoint = goManagementSoftwareAPI.root.addResource("reset")
    const resetModel = goManagementSoftwareAPI.addModel('ResetModel', {
      contentType: 'application/json',
      modelName: 'ResetModel',
      schema: {
        schema: JsonSchemaVersion.DRAFT7,
        title: 'ResetModel',
        type: JsonSchemaType.OBJECT,
      }
    });

    resetEndpoint.addMethod('POST', lambdaIntegration, {
      requestModels: {
        'application/json': resetModel,
      },
      requestValidator: requestValidator
    });
  }
}
