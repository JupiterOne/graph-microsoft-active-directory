import { executeStepWithDependencies } from '@jupiterone/integration-sdk-testing';
import { buildStepTestConfigForStep } from '../../../test/config';
import { Steps } from '../constants';
import { omit } from 'lodash';

beforeAll(() => jest.useFakeTimers().setSystemTime(new Date('2020-01-01')));
afterAll(() => jest.useRealTimers());

test('fetch-users', async () => {
  const stepConfig = buildStepTestConfigForStep(Steps.USERS);
  const stepResult = await executeStepWithDependencies(stepConfig);
  expect(stepResult).toMatchStepMetadata(stepConfig);
  expect(omit(stepResult.collectedEntities[0], ['_rawData'])).toMatchSnapshot({
    createdOn: expect.any(Number),
    updatedOn: expect.any(Number),
  });
});

test('fetch-groups', async () => {
  const stepConfig = buildStepTestConfigForStep(Steps.GROUPS);
  const stepResult = await executeStepWithDependencies(stepConfig);
  expect(stepResult).toMatchStepMetadata(stepConfig);
  expect(omit(stepResult.collectedEntities[0], ['_rawData'])).toMatchSnapshot({
    createdOn: expect.any(Number),
    updatedOn: expect.any(Number),
  });
});

test('build-user-group-relationships', async () => {
  const stepConfig = buildStepTestConfigForStep(Steps.GROUP_USER_RELATIONSHIPS);
  const stepResult = await executeStepWithDependencies(stepConfig);
  expect(stepResult).toMatchStepMetadata(stepConfig);
  expect(stepResult.collectedRelationships[0]).toMatchSnapshot();
});

test('fetch-devices', async () => {
  const stepConfig = buildStepTestConfigForStep(Steps.DEVICES);
  const stepResult = await executeStepWithDependencies(stepConfig);
  expect(stepResult).toMatchStepMetadata(stepConfig);
  expect(omit(stepResult.collectedEntities[0], ['_rawData'])).toMatchSnapshot({
    lastSeenOn: expect.any(Number),
    createdOn: expect.any(Number),
    updatedOn: expect.any(Number),
  });
});
