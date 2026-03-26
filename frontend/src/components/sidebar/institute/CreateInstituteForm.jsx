const labelCls =
	'block text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--text-secondary)] mb-1.5';
const inputCls =
	'w-full px-3 py-2.5 bg-[var(--bg-input)] border border-[var(--border)] rounded-[var(--radius-md)] text-[var(--text-primary)] text-sm outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--text-ghost)] focus:border-teal-500 focus:shadow-[0_0_0_2px_rgba(20,184,166,0.07)] disabled:opacity-50';

export default function CreateInstituteForm({
	newInstName,
	createError,
	createLoading,
	onNameChange,
	onSubmit,
	onCancel,
}) {
	return (
		<form
			className='flex flex-col gap-3 p-4 rounded-xl bg-[var(--bg-panel)] border border-[var(--border)]'
			onSubmit={onSubmit}
			noValidate
		>
			<p className='text-[13px] font-medium text-[var(--text-primary)]'>
				Create a new institute
			</p>
			{createError && (
				<p
					className='text-[12px] text-red-400 bg-red-400/[0.06] border border-red-400/[0.15] rounded-md px-2.5 py-1.5'
					role='alert'
				>
					{createError}
				</p>
			)}
			<div>
				<label className={labelCls} htmlFor='new-inst-name'>
					Institute Name
				</label>
				<input
					id='new-inst-name'
					className={inputCls}
					type='text'
					value={newInstName}
					onChange={(e) => onNameChange(e.target.value)}
					placeholder='e.g. Pinecrest High'
					required
					autoFocus
					autoComplete='off'
				/>
			</div>
			<div className='flex gap-2'>
				<button
					type='submit'
					className='flex-1 px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-[13px] font-medium rounded-lg transition-[background] duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
					disabled={createLoading}
				>
					{createLoading ? 'Creating…' : 'Create'}
				</button>
				<button
					type='button'
					className='px-4 py-2 bg-[var(--bg-hover)] hover:bg-[var(--border)] text-[var(--text-muted)] text-[13px] font-medium rounded-lg transition-[background] duration-150 focus-visible:outline-2 focus-visible:outline-[var(--teal-700)]'
					onClick={onCancel}
				>
					Cancel
				</button>
			</div>
		</form>
	);
}