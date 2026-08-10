import { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Field,
  Input,
  RadioCards,
  Select,
  Textarea,
  Toggle,
  cx,
} from '../components/ui/index.jsx';
import OptionEditor from '../components/choice/OptionEditor.jsx';
import DatePicker from '../components/schedule/DatePicker.jsx';
import { api } from '../api.js';
import { navigate } from '../lib/router.jsx';
import { fromLocalInputValue, toLocalInputValue } from '../lib/format.js';
import { rememberPoll, setPollToken } from '../lib/voter.js';
import { THEMES } from '../lib/theme.js';
import { LIMITS, SLOT_MINUTES } from '../../shared/constants.js';

const HOURS = Array.from({ length: 25 }, (_, h) => h);
const hourLabel = (h) => `${String(h).padStart(2, '0')}:00`;

const emptyOption = () => ({ label: '', place: '', priceBand: '', note: '' });

export default function CreatePoll() {
  const initialType = new URLSearchParams(window.location.search).get('type');
  const [type, setType] = useState(initialType === 'schedule' ? 'schedule' : 'choice');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [password, setPassword] = useState('');
  const [rosterText, setRosterText] = useState('');

  const [options, setOptions] = useState(() => [emptyOption(), emptyOption()]);
  const [dates, setDates] = useState([]);
  const [startHour, setStartHour] = useState(11);
  const [endHour, setEndHour] = useState(14);
  const [slotMin, setSlotMin] = useState(30);

  const [theme, setTheme] = useState('simple');
  const [anonymous, setAnonymous] = useState(false);
  const [multiEnabled, setMultiEnabled] = useState(false);
  const [multiMax, setMultiMax] = useState(2);
  const [allowAbstain, setAllowAbstain] = useState(true);
  const [allowChange, setAllowChange] = useState(false);
  const [resultVisibility, setResultVisibility] = useState('afterVote');
  const [tiebreak, setTiebreak] = useState('manual');
  const [closeAtValue, setCloseAtValue] = useState('');
  const [closeWhenAllVoted, setCloseWhenAllVoted] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const passwordRef = useRef(null);

  const roster = useMemo(
    () =>
      rosterText
        .split(/[\n,]/)
        .map((s) => s.trim())
        .filter(Boolean)
        .slice(0, LIMITS.MAX_ROSTER),
    [rosterText],
  );

  // 익명이면 "누가 투표했는지"를 알 수 없으므로 명단 기반 기능이 성립하지 않는다.
  const rosterLocked = anonymous;
  const effectiveRoster = rosterLocked ? [] : roster;

  const submit = async () => {
    setError('');
    setPasswordError('');

    // 서버까지 왕복하지 않고 바로 알려줄 수 있는 것(길이)은 여기서 먼저 걸러서,
    // 어느 입력칸이 문제인지 바로 보여준다.
    if (password.length < LIMITS.PASSWORD_MIN) {
      setPasswordError(`관리 비밀번호는 ${LIMITS.PASSWORD_MIN}자 이상이어야 합니다. (현재 ${password.length}자)`);
      passwordRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      passwordRef.current?.focus();
      return;
    }

    setSubmitting(true);
    try {
      const body = {
        type,
        title,
        description,
        password,
        roster: effectiveRoster,
        settings: {
          theme,
          anonymous,
          allowAbstain,
          allowChange,
          multiSelect: { enabled: type === 'schedule' ? true : multiEnabled, max: multiEnabled ? multiMax : 0 },
          resultVisibility,
          tiebreak,
          closeAt: fromLocalInputValue(closeAtValue),
          closeWhenAllVoted: effectiveRoster.length > 0 && closeWhenAllVoted,
        },
      };
      if (type === 'choice') {
        body.options = options.filter((o) => o.label.trim());
      } else {
        body.schedule = { dates, startMin: startHour * 60, endMin: endHour * 60, slotMin };
      }

      const created = await api.createPoll(body);
      setPollToken(created.id, created.adminToken);
      rememberPoll({ id: created.id, title: created.poll.title, type: created.poll.type, owner: true });
      navigate(`/p/${created.id}?created=1`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-xl font-extrabold text-stone-900">새 투표 만들기</h1>
        <p className="mt-1 text-sm text-stone-500">만들고 나면 링크가 생깁니다. 그 링크만 공유하면 끝이에요.</p>
      </div>

      <Alert>{error}</Alert>

      <div className="grid gap-2 sm:grid-cols-2">
        {[
          { value: 'choice', icon: '🍽️', label: '선택지 투표', body: '메뉴·안건 중에서 고르기' },
          { value: 'schedule', icon: '📅', label: '날짜 조율', body: '가능한 시간대 겹쳐보기' },
        ].map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setType(t.value)}
            aria-pressed={type === t.value}
            className={cx(
              'rounded-2xl border p-4 text-left transition-colors',
              type === t.value
                ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-200'
                : 'border-stone-200 bg-white hover:bg-stone-50',
            )}
          >
            <span className="text-xl" aria-hidden="true">
              {t.icon}
            </span>
            <span className="mt-1 block text-sm font-bold text-stone-900">{t.label}</span>
            <span className="text-sm text-stone-500">{t.body}</span>
          </button>
        ))}
      </div>

      <Card>
        <h2 className="text-base font-bold text-stone-900">투표 화면 분위기</h2>
        <p className="mt-1 text-sm text-stone-500">참여자에게 보이는 화면 스타일을 정해요. 언제든 바꿀 순 없으니 신중하게!</p>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {THEMES.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTheme(t.id)}
              aria-pressed={theme === t.id}
              className={cx(
                'rounded-2xl border p-3.5 text-left transition-colors',
                theme === t.id
                  ? 'border-emerald-500 bg-emerald-50/60 ring-1 ring-emerald-200'
                  : 'border-stone-200 bg-white hover:bg-stone-50',
              )}
            >
              <span className="flex items-center gap-1.5 text-sm font-bold text-stone-900">
                <span aria-hidden="true">{t.emoji}</span>
                {t.label}
              </span>
              <span className="mt-0.5 block text-xs font-semibold text-stone-500">{t.tagline}</span>
              <span className="mt-1 block text-sm text-stone-500">{t.description}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card className="space-y-4">
        <Field label="제목" required htmlFor="title">
          <Input
            id="title"
            value={title}
            maxLength={LIMITS.TITLE}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={type === 'schedule' ? '팀 회식 언제 할까요' : '오늘 점심 뭐 먹지'}
          />
        </Field>
        <Field label="설명" hint="없어도 됩니다." htmlFor="description">
          <Textarea
            id="description"
            rows={2}
            value={description}
            maxLength={LIMITS.DESCRIPTION}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="투표할 때 참고할 내용을 적어주세요."
          />
        </Field>
      </Card>

      {type === 'choice' ? (
        <Card>
          <h2 className="mb-3 text-base font-bold text-stone-900">선택지</h2>
          <OptionEditor options={options} onChange={setOptions} />
        </Card>
      ) : (
        <Card className="space-y-4">
          <h2 className="text-base font-bold text-stone-900">후보 날짜와 시간대</h2>
          <DatePicker selected={dates} onChange={setDates} />
          <div className="grid grid-cols-3 gap-2">
            <Field label="시작" htmlFor="startHour">
              <Select
                id="startHour"
                value={startHour}
                onChange={(e) => {
                  const v = Number(e.target.value);
                  setStartHour(v);
                  if (v >= endHour) setEndHour(Math.min(24, v + 1));
                }}
              >
                {HOURS.slice(0, 24).map((h) => (
                  <option key={h} value={h}>
                    {hourLabel(h)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="종료" htmlFor="endHour">
              <Select id="endHour" value={endHour} onChange={(e) => setEndHour(Number(e.target.value))}>
                {HOURS.filter((h) => h > startHour).map((h) => (
                  <option key={h} value={h}>
                    {hourLabel(h)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="단위" htmlFor="slotMin">
              <Select id="slotMin" value={slotMin} onChange={(e) => setSlotMin(Number(e.target.value))}>
                {SLOT_MINUTES.map((m) => (
                  <option key={m} value={m}>
                    {m}분
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        </Card>
      )}

      <Card className="space-y-4">
        <h2 className="text-base font-bold text-stone-900">투표 방식</h2>

        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle
            checked={anonymous}
            onChange={(v) => {
              setAnonymous(v);
              if (v) setCloseWhenAllVoted(false);
            }}
            label="익명 투표"
            description="이름을 받지 않고, 누가 뭘 골랐는지 아무에게도 보이지 않습니다."
          />
          <Toggle
            checked={allowAbstain}
            onChange={setAllowAbstain}
            label="기권 허용"
            description="'아무거나 좋아요'로 참여할 수 있습니다."
          />
          {type === 'choice' && (
            <Toggle
              checked={multiEnabled}
              onChange={setMultiEnabled}
              label="복수 선택"
              description="여러 개를 고를 수 있습니다."
            />
          )}
          <Toggle
            checked={allowChange}
            onChange={setAllowChange}
            label="투표 후 수정 허용"
            description="참여자가 마음을 바꿀 수 있습니다."
          />
        </div>

        {type === 'choice' && multiEnabled && (
          <Field label="최대 몇 개까지" htmlFor="multiMax">
            <Select id="multiMax" value={multiMax} onChange={(e) => setMultiMax(Number(e.target.value))}>
              {Array.from({ length: Math.max(1, options.length) }, (_, i) => i + 1).map((n) => (
                <option key={n} value={n}>
                  {n}개
                </option>
              ))}
            </Select>
          </Field>
        )}

        <Field label="결과 공개 시점">
          <RadioCards
            name="resultVisibility"
            value={resultVisibility}
            onChange={setResultVisibility}
            columns={3}
            options={[
              { value: 'afterVote', label: '내가 투표한 뒤', description: '앞사람 따라가기를 줄입니다' },
              { value: 'always', label: '항상 공개', description: '언제든 현황을 봅니다' },
              { value: 'afterClose', label: '마감 후에만', description: '끝날 때까지 비공개' },
            ]}
          />
        </Field>

        <Field
          label="무승부가 나오면"
          hint="1위가 동점일 때 어떻게 할지 정합니다."
        >
          <RadioCards
            name="tiebreak"
            value={tiebreak}
            onChange={setTiebreak}
            columns={3}
            options={[
              { value: 'manual', label: '그때 고르기', description: '마감 후 관리자가 선택' },
              { value: 'roulette', label: '룰렛 자동', description: '무작위로 하나 뽑기' },
              { value: 'runoff', label: '재투표 자동', description: '동점끼리 다시 투표' },
            ]}
          />
        </Field>
      </Card>

      <Card>
        <button
          type="button"
          onClick={() => setShowAdvanced((v) => !v)}
          aria-expanded={showAdvanced}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="text-base font-bold text-stone-900">참여자 명단 · 마감 설정</span>
          <span className="text-stone-400">{showAdvanced ? '▲' : '▼'}</span>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4">
            <Field
              label="참여자 명단"
              hint={
                rosterLocked
                  ? '익명 투표에서는 명단을 쓸 수 없습니다. 누가 투표했는지 알 수 없기 때문입니다.'
                  : '한 줄에 한 명씩 적으면 누가 아직 투표하지 않았는지 보여줍니다. 비워두면 누구나 자유롭게 참여합니다.'
              }
              htmlFor="roster"
            >
              <Textarea
                id="roster"
                rows={3}
                disabled={rosterLocked}
                value={rosterText}
                onChange={(e) => setRosterText(e.target.value)}
                placeholder={'김철수\n이영희\n박민수'}
              />
            </Field>

            {effectiveRoster.length > 0 && (
              <p className="text-sm text-stone-500">{effectiveRoster.length}명 등록됨</p>
            )}

            <Toggle
              checked={closeWhenAllVoted && effectiveRoster.length > 0}
              onChange={setCloseWhenAllVoted}
              disabled={effectiveRoster.length === 0}
              disabledReason="참여자 명단을 먼저 등록해주세요."
              label="전원 투표하면 자동 마감"
              description="명단에 있는 사람이 모두 참여하는 순간 결과가 확정됩니다."
            />

            <Field label="마감 시각" hint="비워두면 시간 제한 없이 진행됩니다." htmlFor="closeAt">
              <div className="flex gap-2">
                <Input
                  id="closeAt"
                  type="datetime-local"
                  value={closeAtValue}
                  min={toLocalInputValue(Date.now() + 60_000)}
                  onChange={(e) => setCloseAtValue(e.target.value)}
                />
                {closeAtValue && (
                  <Button variant="secondary" onClick={() => setCloseAtValue('')}>
                    지우기
                  </Button>
                )}
              </div>
            </Field>

            <div className="flex flex-wrap gap-2">
              {[
                { label: '1시간 뒤', ms: 60 * 60 * 1000 },
                { label: '오늘 12시', at: () => atToday(12) },
                { label: '내일 이맘때', ms: 24 * 60 * 60 * 1000 },
              ].map((preset) => (
                <Button
                  key={preset.label}
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    setCloseAtValue(toLocalInputValue(preset.at ? preset.at() : Date.now() + preset.ms))
                  }
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>
        )}
      </Card>

      <Card className="space-y-4">
        <Field
          label="관리 비밀번호"
          required
          error={passwordError}
          hint="이 비밀번호를 아는 사람만 투표를 수정·마감·삭제할 수 있습니다. 잊어버리면 되찾을 수 없으니 기억해두세요."
          htmlFor="password"
        >
          <Input
            id="password"
            ref={passwordRef}
            type="password"
            autoComplete="new-password"
            value={password}
            maxLength={LIMITS.PASSWORD_MAX}
            aria-invalid={Boolean(passwordError)}
            onChange={(e) => {
              setPassword(e.target.value);
              if (passwordError) setPasswordError('');
            }}
            placeholder={`${LIMITS.PASSWORD_MIN}자 이상`}
            className={passwordError ? '!border-rose-400 !ring-2 !ring-rose-100' : ''}
          />
        </Field>
      </Card>

      <Button size="lg" className="w-full" loading={submitting} onClick={submit}>
        투표 만들고 링크 받기
      </Button>
    </div>
  );
}

function atToday(hour) {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  if (d.getTime() <= Date.now()) d.setDate(d.getDate() + 1);
  return d.getTime();
}
