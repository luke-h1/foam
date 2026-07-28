import { createAnimationBudget } from '../emoteSheetAnimationBudget';

test('grants animation to cells up to the cap', () => {
  const budget = createAnimationBudget(2);
  const granted: boolean[] = [];

  budget.acquire(value => granted.push(value));
  budget.acquire(value => granted.push(value));
  budget.acquire(value => granted.push(value));

  expect(granted).toEqual([true, true]);
});

test('promotes a waiting cell when a granted cell is released', () => {
  const budget = createAnimationBudget(1);
  const third: boolean[] = [];

  const releaseFirst = budget.acquire(() => undefined);
  budget.acquire(value => third.push(value));

  expect(third).toEqual([]);

  releaseFirst();

  expect(third).toEqual([true]);
});

test('releasing an ungranted cell does not free a slot', () => {
  const budget = createAnimationBudget(1);
  const late: boolean[] = [];

  budget.acquire(() => undefined);
  const releaseWaiting = budget.acquire(() => undefined);

  releaseWaiting();
  budget.acquire(value => late.push(value));

  expect(late).toEqual([]);
});

test('reset clears every slot so a reopened sheet starts from zero', () => {
  const budget = createAnimationBudget(1);
  const afterReset: boolean[] = [];

  budget.acquire(() => undefined);
  budget.reset();
  budget.acquire(value => afterReset.push(value));

  expect(afterReset).toEqual([true]);
});

test('releasing a slot after reset does not raise the cap', () => {
  const budget = createAnimationBudget(1);
  const afterReset: boolean[] = [];

  const releaseBeforeReset = budget.acquire(() => undefined);
  budget.reset();
  // The dismissed sheet's cell unmounts after reset and releases its old slot.
  releaseBeforeReset();

  budget.acquire(value => afterReset.push(value));
  budget.acquire(value => afterReset.push(value));

  expect(afterReset).toEqual([true]);
});
