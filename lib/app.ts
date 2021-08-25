import * as cdk from '@aws-cdk/core';
import {GoManagementInfrastructureStack} from "./go_management_infrastructure-stack";

const app = new cdk.App();

const deploymentEnvironment = {
    'account': 'XXXXXXXXXXXX',
    'region': 'us-east-1'
}

// todo: break down by stage for development, pre-prod, etc.
const goManagementInfrastructureStack = new GoManagementInfrastructureStack(app, `GoManagementInfrastructureStack`, {
    env: deploymentEnvironment,
    terminationProtection: false,
});