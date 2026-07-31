'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import type { AccountType } from '@prisma/client';

import { Segmented } from '@/components/productivity/segmented';

import { submitJson } from './client-api';
import { ACCOUNT_ROLE_OPTIONS, ACCOUNT_TYPE_OPTIONS } from './options';
import {
  defaultRoleForType,
  toIsLiability,
  toRole,
  type AccountRole,
  type AccountView,
} from './view';

interface AccountFormProps {
  /** Present → edit (PATCH); absent → create (POST). */
  account?: AccountView;
  /** Called after a successful save (post-refresh) or a cancel. */
  onClose: () => void;
}

/**
 * AccountForm — create/edit an account, in the prototype's modal shape.
 *
 * Client Component, rendered inside the shared productivity modal. Surfaces
 * only the prototype's four fields: name, type (a wrapping segmented control),
 * balance, and role (asset/liability). Everything else is untouched (Option B):
 * `createdAt`/`updatedAt` are service-managed, and a PATCH omits them so the
 * `.partial()` update schema preserves whatever is stored.
 *
 * Choosing CREDIT or LOAN nudges the role to Liability (the prototype's
 * behaviour) — money owed is the overwhelmingly common case for those two. It is
 * only a nudge: the role control stays authoritative and can be set back.
 *
 * BALANCES ARE MANUAL. This form is the ONLY way a balance changes; recording a
 * transaction never touches it (design.md — no double-entry this sprint). The
 * value is entered as a positive magnitude for both assets and liabilities; the
 * role, not the sign, decides which side of net worth it lands on.
 *
 * Submits to the Route Handlers (no Server Actions) and `router.refresh()`es on
 * success. Handler validation errors render inline.
 */
export function AccountForm({ account, onClose }: AccountFormProps) {
  const router = useRouter();

  const [name, setName] = useState(account?.name ?? '');
  const [type, setType] = useState<AccountType>(account?.type ?? 'CHECKING');
  const [balance, setBalance] = useState(account?.balance ?? '');
  const [role, setRole] = useState<AccountRole>(
    account ? toRole(account.isLiability) : 'asset',
  );

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Picking a type re-derives the role default (CREDIT / LOAN → liability). */
  function chooseType(next: AccountType) {
    setType(next);
    setRole(defaultRoleForType(next));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setErrors({ name: 'Give the account a name.' });
      return;
    }
    if (balance !== '' && !(Number(balance) >= 0)) {
      setErrors({ balance: 'Enter the balance as a positive amount.' });
      return;
    }

    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const body = {
      name: trimmed,
      type,
      // An empty balance field reads as zero, matching the prototype.
      balance: balance === '' ? 0 : balance,
      isLiability: toIsLiability(role),
    };

    const result = await submitJson(
      account ? `/api/accounts/${account.id}` : '/api/accounts',
      account ? 'PATCH' : 'POST',
      body,
    );

    if (result.ok) {
      router.refresh();
      onClose();
      return;
    }

    setErrors(result.fieldErrors);
    setFormError(result.formError);
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className="pm-label" htmlFor="fm-name">
        Account name
      </label>
      <input
        id="fm-name"
        className={errors.name ? 'pm-input pm-err' : 'pm-input'}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Everyday Checking"
        autoFocus
        maxLength={120}
      />
      {errors.name ? <span className="pm-error">{errors.name}</span> : null}

      <span className="pm-label">Type</span>
      <Segmented<AccountType>
        ariaLabel="Account type"
        options={ACCOUNT_TYPE_OPTIONS}
        value={type}
        onChange={chooseType}
        wrap
      />

      <label className="pm-label" htmlFor="fm-balance">
        Balance <span className="opt">entered manually</span>
      </label>
      <input
        id="fm-balance"
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        className={errors.balance ? 'pm-input pm-err' : 'pm-input'}
        value={balance}
        onChange={(e) => setBalance(e.target.value)}
        placeholder="0.00"
      />
      {errors.balance ? <span className="pm-error">{errors.balance}</span> : null}

      <span className="pm-label">Role</span>
      <Segmented<AccountRole>
        ariaLabel="Account role"
        options={ACCOUNT_ROLE_OPTIONS}
        value={role}
        onChange={setRole}
      />
      {errors.isLiability ? <span className="pm-error">{errors.isLiability}</span> : null}

      {formError ? <p className="pm-form-error">{formError}</p> : null}

      <div className="pm-foot">
        <button type="button" className="pm-cancel" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="pm-save" disabled={submitting}>
          {submitting ? 'Saving…' : account ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  );
}
