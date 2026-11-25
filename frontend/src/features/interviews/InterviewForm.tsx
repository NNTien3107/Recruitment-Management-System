import { useState, type FormEvent } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import type { Interview, ScheduleInterviewInput } from './interviews.api';

function localInputTime(date: Date) {
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return local.toISOString().slice(0, 16);
}

export function InterviewForm({
  interview,
  pending,
  error,
  onClose,
  onSave,
}: {
  interview?: Interview;
  pending: boolean;
  error?: string;
  onClose: () => void;
  onSave: (input: ScheduleInterviewInput) => void;
}) {
  const initialTime = interview ? localInputTime(new Date(interview.scheduledAt)) : '';
  const [time, setTime] = useState(initialTime);
  const [location, setLocation] = useState(interview?.location ?? '');
  const [timeError, setTimeError] = useState('');
  const [locationError, setLocationError] = useState('');

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending) return;
    const date = new Date(time);
    const validTime = Number.isFinite(date.getTime()) && localInputTime(date) === time;
    const originalTime = interview && time === initialTime ? interview.scheduledAt : undefined;
    const nextDate = originalTime ? new Date(originalTime) : date;
    const nextTimeError =
      !validTime || nextDate.getTime() <= Date.now()
        ? 'Chọn ngày và giờ hợp lệ trong tương lai.'
        : '';
    const nextLocationError = location.trim() ? '' : 'Nhập địa điểm hoặc liên kết họp.';
    setTimeError(nextTimeError);
    setLocationError(nextLocationError);
    if (nextTimeError || nextLocationError) return;

    onSave({ scheduledAt: nextDate.toISOString(), location: location.trim() });
  }

  return (
    <form className="grid gap-4 rounded-lg border border-gray-200 bg-white p-4" onSubmit={submit}>
      <h3 className="font-semibold">{interview ? 'Đổi lịch phỏng vấn' : 'Tạo lịch phỏng vấn'}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Ngày và giờ phỏng vấn"
          hint={`Múi giờ: ${Intl.DateTimeFormat().resolvedOptions().timeZone}`}
          type="datetime-local"
          value={time}
          onChange={(event) => setTime(event.target.value)}
          error={timeError || undefined}
          required
          disabled={pending}
        />
        <Input
          label="Địa điểm hoặc liên kết họp"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          error={locationError || undefined}
          maxLength={500}
          required
          disabled={pending}
        />
      </div>
      {error && (
        <p role="alert" className="text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" loading={pending}>
          Lưu lịch
        </Button>
        <Button variant="secondary" disabled={pending} onClick={onClose}>
          Đóng biểu mẫu
        </Button>
      </div>
    </form>
  );
}
