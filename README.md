# Go Management Software CDK

This CDK manages all the serverless infrastructure needed for the Go Management Software.

The AWS CloudDevelopmentKit (CDK) allows developers to implement their InfrastructureAsCode system designs.

To deploy your own instance of the service, you will need to do the following steps:

1. Create an AWS Account & grab the credentials. You can create an IAM User & set the Secret & Access Keys using

`aws configure`

2. Replace 'XXXXXXXXXXXX' with your AWS Account in app.ts L7.

3. Set your ADMIN_SECRET_KEY which will restrict access to your service.

`export ADMIN_SECRET_KEY=your_admin_key`

4. Deploy your code with one line!

`cdk deploy`

## Note:

Ideally, you should create a directory i.e. GoManagementService. In this directory, please add the following packages:

GoManagementInfrastructure - https://github.com/thealexosmonov/GoManagementInfrastructure

GoManagementService - https://github.com/thealexosmonov/GoManagementService

Make sure to "build" the GoManagementService as described in the README.md, otherwise you will not be able to deploy

## Other Useful Commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template