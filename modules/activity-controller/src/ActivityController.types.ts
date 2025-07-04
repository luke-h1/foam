export type LiveActivityParams = {
  customString: string;
  customNumber: number;
};

export type StartLiveActivityFn = (
  params: LiveActivityParams,
) => Promise<{ activityId: string }>;

export type StopLiveActivityFn = () => Promise<void>;

export type IsLiveActivityRunningFn = () => boolean;
