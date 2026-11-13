export type NotificationEvents = {
  APPLICATION_STATUS_CHANGED: {
    jobTitle: string;
    previousStatus: string;
    status: string;
  };
  INTERVIEW_SCHEDULED: InterviewEvent;
  INTERVIEW_RESCHEDULED: InterviewEvent;
  INTERVIEW_CANCELLED: InterviewEvent;
};

type InterviewEvent = {
  jobTitle: string;
  scheduledAt: string;
  location: string;
};

export type NotificationEvent = {
  [Type in keyof NotificationEvents]: {
    type: Type;
    payload: NotificationEvents[Type];
  };
}[keyof NotificationEvents];
