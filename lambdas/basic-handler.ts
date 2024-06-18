import { DynamoDBStreamHandler} from 'aws-lambda'
import { Logger } from '@aws-lambda-powertools/logger';

const logger = new Logger({ serviceName: 'DemoDynamoDBStreams' })

export const handler: DynamoDBStreamHandler = async (event) => {
  if (event.Records.length < 1) {
    return;
  }

  for (const record of event.Records) {
    logger.info('Record Details', { record })
  }
};