import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Pagination } from '../../components/ui/Pagination';
import { Select } from '../../components/ui/Select';
import { getErrorMessage } from '../../lib/errors';
import { useAuth } from '../auth/auth-context';
import { InterviewForm } from './InterviewForm';
import {
  cancelInterview,
  fetchInterviewApplications,
  fetchInterviewJobs,
  fetchInterviews,
  saveInterview,
  type ApplicationStatus,
  type Interview,
  type InterviewApplication,
  type ScheduleInterviewInput,
} from './interviews.api';

const statusLabels: Record<ApplicationStatus, string> = {
  APPLIED: 'Đã nộp',
  REVIEWING: 'Đang xem xét',
  INTERVIEW_SCHEDULED: 'Đã lên lịch phỏng vấn',
  OFFERED: 'Đã gửi lời mời nhận việc',
  ACCEPTED: 'Đã chấp nhận',
  REJECTED: 'Đã từ chối',
  WITHDRAWN: 'Đã rút đơn',
};

const schedulableStatuses: ReadonlySet<ApplicationStatus> = new Set([
  'REVIEWING',
  'INTERVIEW_SCHEDULED',
  'OFFERED',
]);

const localDate = new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' });

function LoadError({ error, retry }: { error: unknown; retry: () => void }) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <p role="alert" className="text-sm text-red-700">
        {getErrorMessage(error)}
      </p>
      <Button variant="secondary" size="sm" onClick={retry}>
        Thử lại
      </Button>
    </div>
  );
}

export function RecruiterInterviewsPage() {
  const { user } = useAuth();
  if (!user) return null;
  return <RecruiterInterviews key={user.id} recruiterId={user.id} />;
}

function RecruiterInterviews({ recruiterId }: { recruiterId: string }) {
  const [jobPage, setJobPage] = useState(1);
  const [jobId, setJobId] = useState('');
  const jobs = useQuery({
    queryKey: ['interviews', recruiterId, 'jobs', jobPage],
    queryFn: ({ signal }) => fetchInterviewJobs(jobPage, signal),
  });

  return (
    <div className="mx-auto grid max-w-4xl gap-6">
      <h1 className="text-2xl font-semibold">Lịch phỏng vấn</h1>
      {jobs.isPending && <p role="status">Đang tải tin tuyển dụng…</p>}
      {jobs.isError && <LoadError error={jobs.error} retry={() => void jobs.refetch()} />}
      {jobs.isSuccess && (
        <section className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4">
          {jobs.data.data.length === 0 ? (
            <p className="text-gray-600">Trang này chưa có tin tuyển dụng.</p>
          ) : (
            <Select
              label="Tin tuyển dụng"
              value={jobId}
              onChange={(event) => setJobId(event.target.value)}
            >
              <option value="">Chọn tin tuyển dụng</option>
              {jobs.data.data.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title}
                </option>
              ))}
            </Select>
          )}
          {jobs.data.meta && jobs.data.meta.totalPages > 1 && (
            <Pagination
              meta={jobs.data.meta}
              onPageChange={(page) => {
                setJobPage(page);
                setJobId('');
              }}
            />
          )}
        </section>
      )}
      {jobId && <ApplicationPicker key={jobId} recruiterId={recruiterId} jobId={jobId} />}
    </div>
  );
}

function ApplicationPicker({ recruiterId, jobId }: { recruiterId: string; jobId: string }) {
  const [page, setPage] = useState(1);
  const [applicationId, setApplicationId] = useState('');
  const applications = useQuery({
    queryKey: ['interviews', recruiterId, 'applications', jobId, page],
    queryFn: ({ signal }) => fetchInterviewApplications(jobId, page, signal),
  });

  if (applications.isPending) return <p role="status">Đang tải hồ sơ ứng tuyển…</p>;
  if (applications.isError) {
    return <LoadError error={applications.error} retry={() => void applications.refetch()} />;
  }
  const selected = applications.data.data.find((application) => application.id === applicationId);
  const { data, meta } = applications.data;

  return (
    <>
      <section className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4">
        {data.length === 0 ? (
          <p className="text-gray-600">Trang này chưa có hồ sơ ứng tuyển.</p>
        ) : (
          <Select
            label="Hồ sơ ứng tuyển"
            value={applicationId}
            onChange={(event) => setApplicationId(event.target.value)}
          >
            <option value="">Chọn hồ sơ ứng tuyển</option>
            {data.map(({ id, candidate, status }) => (
              <option key={id} value={id}>
                {candidate.fullName} ({candidate.email}) · {statusLabels[status]}
              </option>
            ))}
          </Select>
        )}
        {meta && meta.totalPages > 1 && (
          <Pagination
            meta={meta}
            onPageChange={(nextPage) => {
              setPage(nextPage);
              setApplicationId('');
            }}
          />
        )}
      </section>
      {selected && (
        <ApplicationInterviews key={selected.id} application={selected} recruiterId={recruiterId} />
      )}
    </>
  );
}

type EditState = { type: 'create' } | { type: 'edit' | 'cancel'; interview: Interview };

function ApplicationInterviews({
  recruiterId,
  application,
}: {
  recruiterId: string;
  application: InterviewApplication;
}) {
  const client = useQueryClient();
  const queryKey = ['interviews', recruiterId, 'schedule', application.id];
  const [action, setAction] = useState<EditState>();
  const [feedback, setFeedback] = useState('');
  const schedules = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchInterviews(application.id, signal),
  });
  const canSchedule = schedulableStatuses.has(application.status);
  const mutation = useMutation({
    mutationFn: (
      request:
        | { type: 'save'; interview?: Interview; input: ScheduleInterviewInput }
        | { type: 'cancel'; interview: Interview },
    ) =>
      request.type === 'save'
        ? saveInterview(application.id, request.interview?.id, request.input)
        : cancelInterview(application.id, request.interview.id),
    onSuccess: async (interview, request) => {
      client.setQueryData<Interview[]>(queryKey, (current = []) =>
        [...current.filter((item) => item.id !== interview.id), interview].sort(
          (left, right) => Date.parse(left.scheduledAt) - Date.parse(right.scheduledAt),
        ),
      );
      setAction(undefined);
      setFeedback(request.type === 'cancel' ? 'Đã hủy lịch phỏng vấn.' : 'Đã lưu lịch phỏng vấn.');
      await client.invalidateQueries({ queryKey });
    },
  });
  const selectAction = (nextAction?: EditState) => {
    mutation.reset();
    setFeedback('');
    setAction(nextAction);
  };
  const error = mutation.isError ? getErrorMessage(mutation.error) : undefined;

  return (
    <section className="grid gap-4" aria-labelledby="application-interview-title">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="application-interview-title" className="text-xl font-semibold">
            Lịch của {application.candidate.fullName}
          </h2>
          <p className="text-sm text-gray-600">{statusLabels[application.status]}</p>
        </div>
        {canSchedule && schedules.isSuccess && !action && (
          <Button onClick={() => selectAction({ type: 'create' })}>Tạo lịch</Button>
        )}
      </div>
      {!canSchedule && (
        <p className="text-sm text-gray-600">
          Bạn có thể đặt hoặc đổi lịch khi hồ sơ đã được xem xét và chưa kết thúc.
        </p>
      )}
      {feedback && (
        <p role="status" className="text-sm text-green-700">
          {feedback}
        </p>
      )}
      {schedules.isPending && <p role="status">Đang tải lịch phỏng vấn…</p>}
      {schedules.isError && (
        <LoadError error={schedules.error} retry={() => void schedules.refetch()} />
      )}
      {schedules.isSuccess && schedules.data.length === 0 && (
        <p className="text-gray-600">Hồ sơ này chưa có lịch phỏng vấn.</p>
      )}
      {schedules.isSuccess && schedules.data.length > 0 && (
        <ul className="grid gap-3">
          {schedules.data.map((interview) => (
            <li
              key={interview.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-gray-200 bg-white p-4"
            >
              <div className="min-w-0 flex-1">
                <time className="font-medium" dateTime={interview.scheduledAt}>
                  {localDate.format(new Date(interview.scheduledAt))}
                </time>
                <p className="break-words text-sm text-gray-700">{interview.location}</p>
                {interview.cancelledAt && (
                  <span className="text-sm font-medium text-red-700">Đã hủy</span>
                )}
              </div>
              {!interview.cancelledAt && (
                <div className="flex gap-2">
                  {canSchedule && (
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={Boolean(action)}
                      onClick={() => selectAction({ type: 'edit', interview })}
                    >
                      Đổi lịch
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    disabled={Boolean(action)}
                    onClick={() => selectAction({ type: 'cancel', interview })}
                  >
                    Hủy lịch
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      {action?.type === 'cancel' && (
        <div
          className="grid gap-3 rounded-lg border border-gray-200 bg-white p-4"
          aria-label="Xác nhận hủy lịch"
          role="group"
        >
          <h3 className="font-semibold">
            Hủy lịch lúc {localDate.format(new Date(action.interview.scheduledAt))}?
          </h3>
          {error && (
            <p role="alert" className="text-sm text-red-700">
              {error}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="danger"
              loading={mutation.isPending}
              onClick={() => mutation.mutate({ type: 'cancel', interview: action.interview })}
            >
              Xác nhận hủy
            </Button>
            <Button
              variant="secondary"
              disabled={mutation.isPending}
              onClick={() => selectAction()}
            >
              Giữ lịch
            </Button>
          </div>
        </div>
      )}
      {action && action.type !== 'cancel' && (
        <InterviewForm
          key={action.type === 'edit' ? action.interview.id : 'new'}
          interview={action.type === 'edit' ? action.interview : undefined}
          pending={mutation.isPending}
          error={error}
          onClose={() => selectAction()}
          onSave={(input) =>
            mutation.mutate({
              type: 'save',
              input,
              interview: action.type === 'edit' ? action.interview : undefined,
            })
          }
        />
      )}
    </section>
  );
}
