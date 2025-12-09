import React, { useContext, useMemo, useState } from 'react';
import { LanguageContext } from '../../context/LanguageContext';

const STATUS_KEYS = ['all', 'WaitingForPickup', 'Shipping', 'Completed', 'Cancelled', 'Paid'];

export default function SortBar({ onStatusChange }) {
	const { t } = useContext(LanguageContext);
	const [selected, setSelected] = useState(0);

	const statusList = useMemo(
		() => STATUS_KEYS.map((key) => ({
			key,
			label: t(`orderHistory.statuses.${key}`),
		})),
		[t],
	);

	const handleClick = (idx, key) => {
		setSelected(idx);
		if (onStatusChange) onStatusChange(key);
	};

	return (
		<div className="box-border flex flex-col gap-4 items-start px-[144px] py-6 relative w-full bg-white border-b border-gray-200">
			<div className="flex items-baseline justify-start gap-8 relative w-full">
				{statusList.map((status, idx) => (
					<button
						key={status.key}
						type="button"
						onClick={() => handleClick(idx, status.key)}
						className={`font-alata text-[18px] px-2 py-2 focus:outline-none transition-colors duration-150 border-b-2 ${
							selected === idx 
								? "text-primary border-primary font-bold" 
								: "text-gray-500 border-transparent hover:text-gray-700"
						}`}
					>
						{status.label}
					</button>
				))}
			</div>
		</div>
	);
}
