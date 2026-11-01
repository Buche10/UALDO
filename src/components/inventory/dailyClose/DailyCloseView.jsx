import React, { useState, useEffect, useCallback } from 'react';
import { AlertCircle } from 'lucide-react';
import { getUser } from '../../../services/auth';
import { can, ABILITIES } from '../../../services/permissions';
import { getDailyCloseSummary, createDailyClose, getCount } from '../../../services/inventoryCountsClient';
import { canCountLocation, canValidateLocation } from './dailyClosePermissions';
import { getTodayStr, getYesterdayStr } from './dailyCloseDates';
import DailyCloseHeader from './DailyCloseHeader';
import DailyCloseCard from './DailyCloseCard';
import DifferencesList from './DifferencesList';
import CountSheet from '../counts/CountSheet';

export default function DailyCloseView({ user: propUser, initialDate }) {
  const currentUser = propUser || getUser();
  const today = getTodayStr();
  const yesterday = getYesterdayStr();

  const [selectedDate, setSelectedDate] = useState(initialDate || today);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  const [activeCountId, setActiveCountId] = useState(null);
  const [activeCountDetail, setActiveCountDetail] = useState(null);
  const [viewMode, setViewMode] = useState('summary');
  const [sheetOrigin, setSheetOrigin] = useState('summary');

  const canSeeCosts = can(currentUser, ABILITIES.INVENTORY_COSTS);
  const canAdjust = can(currentUser, ABILITIES.INVENTORY_ADJUST);

  const loadSummary = useCallback(async (dateToLoad) => {
    setLoading(true);
    setError(null);
    const res = await getDailyCloseSummary(dateToLoad);
    setLoading(false);

    if (res.ok) {
      setSummaryData(res.data?.data || res.data);
    } else {
      setError(res.error || res.data?.message || 'No se pudo cargar el resumen del cierre.');
    }
  }, []);

  useEffect(() => {
    loadSummary(selectedDate);
  }, [selectedDate, loadSummary]);

  const handleDateChange = (newDate) => {
    setSelectedDate(newDate);
    setActiveCountId(null);
    setActiveCountDetail(null);
    setViewMode('summary');
    setSheetOrigin('summary');
  };

  const handleStartCount = async (location) => {
    setLoading(true);
    setError(null);
    const res = await createDailyClose(location, selectedDate);
    setLoading(false);

    const countId = res.ok
      ? (res.data?.data?.id || res.data?.id)
      : (res.status === 409 ? (res.data?.existing_count_id || res.data?.id) : null);

    if (countId) {
      setSheetOrigin('summary');
      setActiveCountId(countId);
      setViewMode('sheet');
    } else {
      setError(res.error || res.data?.message || 'Error al iniciar conteo.');
    }
  };

  const handleOpenDifferences = async (countId) => {
    setLoading(true);
    setError(null);
    const res = await getCount(countId);
    setLoading(false);

    if (res.ok) {
      setActiveCountId(countId);
      setActiveCountDetail(res.data?.data || res.data);
      setViewMode('differences');
    } else {
      setError(res.error || res.data?.message || 'Error al cargar el detalle del cierre.');
    }
  };

  const handleBackFromSheet = async () => {
    if (sheetOrigin === 'differences' && activeCountId) {
      setLoading(true);
      const res = await getCount(activeCountId);
      setLoading(false);
      if (res.ok) {
        setActiveCountDetail(res.data?.data || res.data);
      }
      setViewMode('differences');
      setSheetOrigin('summary');
      loadSummary(selectedDate);
      return;
    }
    setViewMode('summary');
    setActiveCountId(null);
    loadSummary(selectedDate);
  };

  if (viewMode === 'sheet' && activeCountId) {
    return (
      <CountSheet
        countId={activeCountId}
        isDailyClose={true}
        backLabel={sheetOrigin === 'differences' ? 'Volver a diferencias' : undefined}
        onBack={handleBackFromSheet}
        onSubmitSuccess={(updatedData) => {
          loadSummary(selectedDate);
          if (updatedData && updatedData.status === 'submitted') {
            setActiveCountDetail(updatedData);
            setViewMode('differences');
          } else {
            setViewMode('summary');
            setActiveCountId(null);
          }
        }}
      />
    );
  }

  if (viewMode === 'differences' && activeCountDetail) {
    return (
      <DifferencesList
        count={activeCountDetail}
        canValidate={canValidateLocation(currentUser, activeCountDetail.location, activeCountDetail.status)}
        onBack={() => {
          setViewMode('summary');
          setActiveCountId(null);
          setActiveCountDetail(null);
          loadSummary(selectedDate);
        }}
        onCountUpdated={(updated) => {
          setActiveCountDetail(updated);
          loadSummary(selectedDate);
        }}
        onOpenEditSheet={() => {
          setSheetOrigin('differences');
          setViewMode('sheet');
        }}
      />
    );
  }

  const locations = summaryData?.locations || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <DailyCloseHeader
        selectedDate={selectedDate}
        today={today}
        yesterday={yesterday}
        onDateChange={handleDateChange}
      />

      {error && (
        <div style={{ padding: '12px 14px', borderRadius: '12px', background: 'var(--error-soft)', border: '1px solid var(--border-error)', color: 'var(--error)', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
          <button type="button" onClick={() => loadSummary(selectedDate)} className="btn-primary" style={{ padding: '4px 10px', fontSize: '11px', borderRadius: '9999px' }}>
            Reintentar
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontSize: '13px' }}>
          Cargando estado de las áreas...
        </div>
      ) : locations.length === 0 ? (
        <div className="glass-card" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
          No hay áreas asignadas para conteo en tu cargo.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {locations.map((loc) => (
            <DailyCloseCard
              key={loc.location}
              item={loc}
              canCount={canCountLocation(currentUser, loc.location)}
              canValidate={canValidateLocation(currentUser, loc.location, loc.status)}
              canAdjust={canAdjust}
              canSeeCosts={canSeeCosts}
              onStartCount={handleStartCount}
              onOpenCount={(id) => {
                setSheetOrigin('summary');
                setActiveCountId(id);
                setViewMode('sheet');
              }}
              onOpenDifferences={handleOpenDifferences}
            />
          ))}
        </div>
      )}
    </div>
  );
}
