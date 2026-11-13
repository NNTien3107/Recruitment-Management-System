import React, { useEffect, useState } from 'react';
import {
  candidateApi,
  CandidateProfileResponse,
  EducationItem,
  ExperienceItem,
} from '../../api/candidateApi';

export const ProfilePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null,
  );

  // Form states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [title, setTitle] = useState('');
  const [bio, setBio] = useState('');
  const [skillsInput, setSkillsInput] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [experience, setExperience] = useState<ExperienceItem[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data: CandidateProfileResponse = await candidateApi.getProfile();
      setFullName(data.fullName || '');
      setEmail(data.email || '');
      setPhone(data.profile?.phone || '');
      setAddress(data.profile?.address || '');
      setTitle(data.profile?.title || '');
      setBio(data.profile?.bio || '');
      setSkills(data.profile?.skills || []);
      setExperience(data.profile?.experience || []);
      setEducation(data.profile?.education || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: 'error', text: `Không thể tải hồ sơ: ${msg}` });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && skillsInput.trim()) {
      e.preventDefault();
      if (!skills.includes(skillsInput.trim())) {
        setSkills([...skills, skillsInput.trim()]);
      }
      setSkillsInput('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setSkills(skills.filter((s) => s !== skillToRemove));
  };

  const handleAddExperience = () => {
    setExperience([
      ...experience,
      { company: '', position: '', startDate: '', endDate: '', description: '' },
    ]);
  };

  const handleUpdateExperience = (index: number, field: keyof ExperienceItem, value: string) => {
    const updated = [...experience];
    updated[index] = { ...updated[index], [field]: value };
    setExperience(updated);
  };

  const handleRemoveExperience = (index: number) => {
    setExperience(experience.filter((_, i) => i !== index));
  };

  const handleAddEducation = () => {
    setEducation([
      ...education,
      { school: '', degree: '', major: '', startDate: '', endDate: '' },
    ]);
  };

  const handleUpdateEducation = (index: number, field: keyof EducationItem, value: string) => {
    const updated = [...education];
    updated[index] = { ...updated[index], [field]: value };
    setEducation(updated);
  };

  const handleRemoveEducation = (index: number) => {
    setEducation(education.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await candidateApi.updateProfile({
        fullName,
        phone,
        address,
        title,
        bio,
        skills,
        experience,
        education,
      });
      setMessage({ type: 'success', text: 'Cập nhật hồ sơ cá nhân thành công!' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setMessage({ type: 'error', text: `Lỗi khi lưu hồ sơ: ${msg}` });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '60px', color: '#6b7280' }}>
        Đang tải thông tin hồ sơ...
      </div>
    );
  }

  const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '14px',
    outline: 'none',
    boxSizing: 'border-box',
    marginTop: '6px',
  };

  const sectionStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    marginBottom: '24px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
  };

  return (
    <div style={{ maxWidth: '850px', margin: '32px auto', padding: '0 20px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: '700', color: '#111827', margin: '0 0 6px 0' }}>
          Hồ sơ cá nhân (UC07)
        </h1>
        <p style={{ color: '#6b7280', fontSize: '14px', margin: 0 }}>
          Quản lý thông tin nghề nghiệp, học vấn, kinh nghiệm và kỹ năng chuyên môn của bạn.
        </p>
      </div>

      {message && (
        <div
          style={{
            padding: '12px 16px',
            borderRadius: '8px',
            marginBottom: '20px',
            fontSize: '14px',
            backgroundColor: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
            color: message.type === 'success' ? '#166534' : '#991b1b',
            border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`,
          }}
        >
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Thông tin cơ bản */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: 0 }}>
            1. Thông tin cơ bản
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Họ và tên *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Email</label>
              <input
                type="email"
                disabled
                value={email}
                style={{ ...inputStyle, backgroundColor: '#f9fafb', color: '#6b7280' }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '16px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Số điện thoại
              </label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="0912345678"
                style={inputStyle}
              />
            </div>

            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                Vị trí / Chức danh mong muốn
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="VD: Fullstack NodeJS & React Developer"
                style={inputStyle}
              />
            </div>
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>Địa chỉ</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Quận Cầu Giấy, Hà Nội"
              style={inputStyle}
            />
          </div>

          <div style={{ marginTop: '16px' }}>
            <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151' }}>
              Giới thiệu bản thân
            </label>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tóm tắt ngắn gọn thế mạnh, mục tiêu nghề nghiệp..."
              style={{ ...inputStyle, resize: 'vertical' }}
            />
          </div>
        </div>

        {/* Kỹ năng */}
        <div style={sectionStyle}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', marginTop: 0 }}>
            2. Kỹ năng chuyên môn
          </h2>
          <label style={{ fontSize: '14px', color: '#6b7280' }}>
            Nhập tên kỹ năng và nhấn <kbd style={{ padding: '2px 6px', background: '#e5e7eb', borderRadius: '4px' }}>Enter</kbd>
          </label>
          <input
            type="text"
            value={skillsInput}
            onChange={(e) => setSkillsInput(e.target.value)}
            onKeyDown={handleAddSkill}
            placeholder="VD: TypeScript, NestJS, Docker, React..."
            style={inputStyle}
          />

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '12px' }}>
            {skills.map((skill) => (
              <span
                key={skill}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  backgroundColor: '#e0f2fe',
                  color: '#0369a1',
                  padding: '4px 10px',
                  borderRadius: '16px',
                  fontSize: '13px',
                  fontWeight: '500',
                }}
              >
                {skill}
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(skill)}
                  style={{
                    marginLeft: '6px',
                    border: 'none',
                    background: 'none',
                    color: '#0369a1',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                  }}
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Kinh nghiệm làm việc */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
              3. Kinh nghiệm làm việc
            </h2>
            <button
              type="button"
              onClick={handleAddExperience}
              style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              + Thêm kinh nghiệm
            </button>
          </div>

          {experience.map((exp, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid #e5e7eb',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '12px',
                backgroundColor: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Kinh nghiệm #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveExperience(idx)}
                  style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }}
                >
                  Xóa
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Tên công ty"
                  value={exp.company}
                  onChange={(e) => handleUpdateExperience(idx, 'company', e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Vị trí đảm nhiệm"
                  value={exp.position}
                  onChange={(e) => handleUpdateExperience(idx, 'position', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Bắt đầu (VD: 01/2023)"
                  value={exp.startDate}
                  onChange={(e) => handleUpdateExperience(idx, 'startDate', e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Kết thúc (VD: Hiện tại)"
                  value={exp.endDate || ''}
                  onChange={(e) => handleUpdateExperience(idx, 'endDate', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <textarea
                rows={2}
                placeholder="Mô tả công việc và thành tựu chính..."
                value={exp.description || ''}
                onChange={(e) => handleUpdateExperience(idx, 'description', e.target.value)}
                style={{ ...inputStyle, marginTop: '10px', resize: 'vertical' }}
              />
            </div>
          ))}
        </div>

        {/* Học vấn */}
        <div style={sectionStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: 0 }}>
              4. Quá trình học vấn
            </h2>
            <button
              type="button"
              onClick={handleAddEducation}
              style={{
                backgroundColor: '#eff6ff',
                color: '#2563eb',
                border: '1px solid #bfdbfe',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: '500',
                cursor: 'pointer',
              }}
            >
              + Thêm học vấn
            </button>
          </div>

          {education.map((edu, idx) => (
            <div
              key={idx}
              style={{
                border: '1px solid #e5e7eb',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '12px',
                backgroundColor: '#fafafa',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '14px', fontWeight: '600', color: '#374151' }}>
                  Học vấn #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveEducation(idx)}
                  style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer', fontSize: '13px' }}
                >
                  Xóa
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Trường đại học / Cao đẳng"
                  value={edu.school}
                  onChange={(e) => handleUpdateEducation(idx, 'school', e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Bằng cấp (VD: Cử nhân, Kỹ sư)"
                  value={edu.degree || ''}
                  onChange={(e) => handleUpdateEducation(idx, 'degree', e.target.value)}
                  style={inputStyle}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '10px' }}>
                <input
                  type="text"
                  placeholder="Chuyên ngành đào tạo"
                  value={edu.major || ''}
                  onChange={(e) => handleUpdateEducation(idx, 'major', e.target.value)}
                  style={inputStyle}
                />
                <input
                  type="text"
                  placeholder="Niên khóa (VD: 2020 - 2024)"
                  value={edu.startDate ? `${edu.startDate} - ${edu.endDate || ''}` : ''}
                  onChange={(e) => handleUpdateEducation(idx, 'startDate', e.target.value)}
                  style={inputStyle}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '40px' }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: '600',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.7 : 1,
              boxShadow: '0 2px 4px rgba(37,99,235,0.2)',
            }}
          >
            {saving ? 'Đang lưu hồ sơ...' : 'Lưu hồ sơ cá nhân'}
          </button>
        </div>
      </form>
    </div>
  );
};

