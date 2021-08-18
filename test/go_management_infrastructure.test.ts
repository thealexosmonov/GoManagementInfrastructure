import { expect as expectCDK, matchTemplate, MatchStyle } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as GoManagementInfrastructure from '../lib/go_management_infrastructure-stack';

test('Empty Stack', () => {
    const app = new cdk.App();
    // WHEN
    const stack = new GoManagementInfrastructure.GoManagementInfrastructureStack(app, 'MyTestStack');
    // THEN
    expectCDK(stack).to(matchTemplate({
      "Resources": {}
    }, MatchStyle.EXACT))
});
