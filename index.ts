import { AttributeType, StreamViewType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Runtime, StartingPosition } from 'aws-cdk-lib/aws-lambda';
import { App, Stack, RemovalPolicy } from 'aws-cdk-lib';
import { NodejsFunction, NodejsFunctionProps } from 'aws-cdk-lib/aws-lambda-nodejs';
import { join } from 'path'
import { PolicyStatement } from 'aws-cdk-lib/aws-iam';

export class DemoDdbStreamAndLambdaStack extends Stack {
  constructor(app: App, id: string) {
    super(app, id, { 
      env: { account: 'XXX', region: 'XXX', }, // TODO: add account and region
      description: 'Demo for DDB Streams' }
    );

    const dynamoTable = new Table(this, 'joshua-ven-items', {
      partitionKey: {
        name: 'itemId',
        type: AttributeType.STRING
      },
      tableName: 'joshua-ven-items-table',
      stream: StreamViewType.NEW_AND_OLD_IMAGES,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const nodeJsFunctionProps: NodejsFunctionProps = {
      bundling: {
        externalModules: [
          'aws-sdk', // Use the 'aws-sdk' available in the Lambda runtime
        ],
      },
      depsLockFilePath: join(__dirname, 'lambdas', 'package-lock.json'),
      runtime: Runtime.NODEJS_20_X,
    }

    const lambdaFunc = new NodejsFunction(this, 'joshua-ven-basicHandler', {
      entry: join(__dirname, 'lambdas', 'basic-handler.ts'),
      ...nodeJsFunctionProps,
    });

    lambdaFunc.addEventSourceMapping("joshua-ven-ddb-stream-lambda", {
      eventSourceArn: dynamoTable.tableStreamArn,
      batchSize: 1,
      retryAttempts: 1,
      startingPosition: StartingPosition.TRIM_HORIZON,
    })

    lambdaFunc.addToRolePolicy(new PolicyStatement({
      actions: [
        "dynamodb:DescribeStream",
        "dynamodb:GetRecords",
        "dynamodb:GetShardIterator",
        "dynamodb:ListStreams",
      ],
      resources: [dynamoTable.tableStreamArn!]
    }))
  }
}

const app = new App();
new DemoDdbStreamAndLambdaStack(app, 'joshua-ven-DdbStreamExample');
app.synth();