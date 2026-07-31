'use client';

import { useRouter } from 'next/navigation';
import { useState, type FormEvent } from 'react';

import { Segmented } from '@/components/productivity/segmented';

import { todayInputValue } from './format';
import { FLOW_OPTIONS } from './options';
import { submitJson } from './client-api';
import { normalizeCategory, toSignedAmount, type AccountView, type Flow, type TxView } from './view';

interface TxFormProps {
  /** Present → edit (PATCH); absent → create (POST). */
  tx?: TxView;
  /** Accounts available to charge the entry to. Empty locks the form. */
  accounts: AccountView[];
  /** Existing categories, for the free-text field's datalist. */
  categories: string[];
  /** Pre-select this account on a fresh create (e.g. when a filter is active). */
  defaultAccountId?: string | null;
  onClose: () => void;
}

/**
 * TxForm — create/edit a ledger entry, in the prototype's modal shape.
 *
 * Client Component. Fields: account (REQUIRED), direction, amount, category,
 * description, date. `source` is never surfaced — the service forces MANUAL on
 * create and preserves it on edit (CSV import is a later adapter, not a form
 * field), and the timestamps are service-managed. Same Option B discipline as
 * productivity: what the form omits, the `.partial()` PATCH preserves.
 *
 * TWO PROJECTIONS HAPPEN ON SAVE (both in view.ts, never inline):
 *   - direction + magnitude fold into ONE signed amount — outflow is negative.
 *     The owner never types a minus sign; they pick a side.
 *   - the category is trimmed and uppercased so it stays a comparable key.
 *
 * An account is mandatory because `Transaction.accountId` is non-null: an entry
 * with no home would be a record nobody owns. With no accounts at all the form
 * says so and locks rather than offering an impossible save (the prototype's
 * behaviour).
 *
 * Recording an entry does NOT move the account's balance. This is a ledger, not
 * double-entry bookkeeping — balances stay hand-kept in the account form.
 */
export function TxForm({ tx, accounts, categories, defaultAccountId, onClose }: TxFormProps) {
  const router = useRouter();
  const locked = accounts.length === 0;

  const [accountId, setAccountId] = useState(
    tx?.accountId ?? defaultAccountId ?? accounts[0]?.id ?? '',
  );
  const [flow, setFlow] = useState<Flow>(tx?.flow ?? 'out');
  const [amount, setAmount] = useState(tx?.magnitude ?? '');
  const [category, setCategory] = useState(tx?.category ?? '');
  const [description, setDescription] = useState(tx?.description ?? '');
  const [date, setDate] = useState(tx?.date ?? todayInputValue());

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();

    const magnitude = amount.trim();
    if (!(Number(magnitude) > 0)) {
      setErrors({ amount: 'Enter an amount greater than zero.' });
      return;
    }
    const desc = description.trim();
    if (!desc) {
      setErrors({ description: 'Say what this entry was.' });
      return;
    }
    if (!accountId) {
      setErrors({ accountId: 'Choose the account this belongs to.' });
      return;
    }

    setSubmitting(true);
    setErrors({});
    setFormError(null);

    const body = {
      accountId,
      // Direction + magnitude → the single signed Decimal the schema stores.
      amount: toSignedAmount(flow, magnitude),
      category: normalizeCategory(category) || 'GENERAL',
      description: desc,
      occurredOn: date || todayInputValue(),
    };

    const result = await submitJson(
      tx ? `/api/transactions/${tx.id}` : '/api/transactions',
      tx ? 'PATCH' : 'POST',
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

  if (locked) {
    return (
      <>
        <div className="prod-empty">
          <h4>No accounts yet</h4>
          <p>Every entry needs a home — add an account first, then record against it.</p>
        </div>
        <div className="pm-foot">
          <button type="button" className="pm-cancel" onClick={onClose}>
            Close
          </button>
        </div>
      </>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <label className="pm-label" htmlFor="fm-account">
        Account
      </label>
      <select
        id="fm-account"
        className={errors.accountId ? 'pm-input pm-select pm-err' : 'pm-input pm-select'}
        value={accountId}
        onChange={(e) => setAccountId(e.target.value)}
      >
        {accounts.map((a) => (
          <option key={a.id} value={a.id}>
            {a.name}
          </option>
        ))}
      </select>
      {errors.accountId ? <span className="pm-error">{errors.accountId}</span> : null}

      <span className="pm-label">Direction</span>
      <Segmented<Flow>
        ariaLabel="Transaction direction"
        options={FLOW_OPTIONS}
        value={flow}
        onChange={setFlow}
      />

      <label className="pm-label" htmlFor="fm-amount">
        Amount
      </label>
      <input
        id="fm-amount"
        type="number"
        step="0.01"
        min="0"
        inputMode="decimal"
        className={errors.amount ? 'pm-input pm-err' : 'pm-input'}
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        placeholder="0.00"
        autoFocus
      />
      {errors.amount ? <span className="pm-error">{errors.amount}</span> : null}

      <label className="pm-label" htmlFor="fm-category">
        Category
      </label>
      <input
        id="fm-category"
        className={errors.category ? 'pm-input pm-upper pm-err' : 'pm-input pm-upper'}
        list="fin-cat-options"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="e.g. GROCERIES"
        maxLength={60}
      />
      <datalist id="fin-cat-options">
        {categories.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      {errors.category ? <span className="pm-error">{errors.category}</span> : null}

      <label className="pm-label" htmlFor="fm-desc">
        Description
      </label>
      <input
        id="fm-desc"
        className={errors.description ? 'pm-input pm-err' : 'pm-input'}
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="e.g. Market run"
        maxLength={200}
      />
      {errors.description ? <span className="pm-error">{errors.description}</span> : null}

      <label className="pm-label" htmlFor="fm-date">
        Date
      </label>
      <input
        id="fm-date"
        type="date"
        className={errors.occurredOn ? 'pm-input pm-err' : 'pm-input'}
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      {errors.occurredOn ? <span className="pm-error">{errors.occurredOn}</span> : null}

      {formError ? <p className="pm-form-error">{formError}</p> : null}

      <div className="pm-foot">
        <button type="button" className="pm-cancel" onClick={onClose} disabled={submitting}>
          Cancel
        </button>
        <button type="submit" className="pm-save" disabled={submitting}>
          {submitting ? 'Saving…' : tx ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  );
}
