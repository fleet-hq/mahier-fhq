const STATUS_MAP: Record<string, { text: string; classes: string; container: string }> = {
  started: { text: 'STARTED', classes: 'bg-[#EDC843] text-white', container: 'bg-[#EDC843]/30' },
  paid: { text: 'PAID', classes: 'bg-[#F5FFFA] text-[#16A34A]', container: 'bg-[#F5FFFA]/30' },
  confirmed: { text: 'CONFIRMED', classes: 'bg-[#F5FFFA] text-[#16A34A]', container: 'bg-[#F5FFFA]/30' },
  cancelled: { text: 'CANCELLED', classes: 'bg-[#FFEDED] text-[#C62828]', container: 'bg-[#FFEDED]/30' },
  completed: { text: 'COMPLETED', classes: 'bg-[#F5FFFA] text-[#16A34A]', container: 'bg-[#F5FFFA]/30' },
  pending: { text: 'PENDING', classes: 'bg-[#F9F5FF] text-[#7C3AED]', container: 'bg-[#F9F5FF]/30' },
  modified: { text: 'MODIFIED', classes: 'bg-[#FFF8E1] text-[#F59E0B]', container: 'bg-[#FFF8E1]/30' },
  unpaid: { text: 'UNPAID', classes: 'bg-[#FFEDED] text-[#C62828]', container: 'bg-[#FFEDED]/30' },
  partially_paid: { text: 'PARTIALLY PAID', classes: 'bg-[#FFF8E1] text-[#F59E0B]', container: 'bg-[#FFF8E1]/30' },
  refunded: { text: 'REFUNDED', classes: 'bg-[#F5FFFA] text-[#16A34A]', container: 'bg-[#F5FFFA]/30' },
};

const FALLBACK = { text: 'UNKNOWN', classes: 'bg-gray-100 text-gray-500', container: 'bg-gray-100/30' };

export function StatusBadge({ status }: { status: string }) {
  const s = STATUS_MAP[status] || { ...FALLBACK, text: status.toUpperCase() };
  return (
    <div className={`p-0.5 flex items-center justify-center rounded-lg ${s.container}`}>
      <p className={`inline-flex items-center font-medium px-2 py-1 text-[10px] rounded-md ${s.classes}`}>
        {s.text}
      </p>
    </div>
  );
}
