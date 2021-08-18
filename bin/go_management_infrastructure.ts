#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from '@aws-cdk/core';
import { GoManagementInfrastructureStack } from '../lib/go_management_infrastructure-stack';

const app = new cdk.App();
new GoManagementInfrastructureStack(app, 'GoManagementInfrastructureStack');
