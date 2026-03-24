import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n';

interface Props {
  open: boolean;
  teamId: 0 | 1;
  teamName: string;
  score: number;
  editable: boolean;
  onClose: () => void;
  onSave?: (teamId: 0 | 1, startingScore: number) => void;
}

export const TeamSettingsModal: React.FC<Props> = ({ open, teamId, teamName, score, editable, onClose, onSave }) => {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(String(score));

  useEffect(() => {
    setDraft(String(score));
  }, [score, open]);

  if (!open) return null;

  const handleSave = () => {
    const n = Number(draft);
    if (Number.isNaN(n) || n < 0) return;
    onSave?.(teamId, Math.max(0, Math.floor(n)));
    onClose();
  };

  return (
    <div className="modal-backdrop">
      <div className="modal team-settings-modal">
        <h3>
          {t.teamSettings?.title ?? 'Team Settings'} — {teamName}
        </h3>
        <div className="modal-body">
          <div className="settings-row">
            <label className="settings-label">{t.teamSettings?.initialScoreLabel ?? 'Initial score'}</label>
            <input className="settings-input" type="number" min={0} value={draft} onChange={(e) => setDraft(e.target.value)} disabled={!editable} />
          </div>
          {!editable && <p className="muted">{t.teamSettings?.readOnlyInfo ?? 'Only the leader can change this setting'}</p>}
        </div>
        <div className="modal-actions">
          <button className="btn" onClick={onClose}>
            {t.teamSettings?.close ?? 'Close'}
          </button>
          {editable && (
            <button className="btn btn-primary" onClick={handleSave}>
              {t.teamSettings?.save ?? 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
