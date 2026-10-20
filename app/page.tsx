"use client";

import {
  ArrowUpRight,
  Bell,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleHelp,
  Download,
  FileText,
  Gem,
  LayoutDashboard,
  Menu,
  MoreHorizontal,
  Pencil,
  Plus,
  Printer,
  Search,
  Settings,
  ShieldCheck,
  Sparkles,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type EstimateItem = {
  id: string;
  particulars: string;
  pcs: string;
  gross: string;
  tare: string;
  touch: string;
  mcRate: string;
  details: string;
};

type Customer = {
  id: string;
  name: string;
  phone: string;
  address?: string;
  gstin?: string;
  balancePure: number;
  balanceCash: number;
};

type SavedEstimate = {
  id: string;
  number: string;
  customer: string;
  date: string;
  amount: number;
  pure: number;
  gross: number;
  status: "Estimate" | "Billed";
};

type StoredData = {
  customers: Customer[];
  estimates: SavedEstimate[];
};

type Settlement = {
  mode: "cash" | "silver" | "hybrid";
  cash: string;
  bank: string;
  returnWeight: string;
  returnTouch: string;
  discount: string;
};

const initialCustomers: Customer[] = [];
const initialEstimates: SavedEstimate[] = [];

const particularsOptions = [
  "SACHIN CH AND BR",
  "L.FANCY CHAIN",
  "G KADA",
  "VEL KADA",
  "ANT METTI",
  "IMP L.BR",
  "EX FANCY CHAIN",
  "IMP STUD",
  "STUDS",
  "THANDAI",
  "DIA BANGLE",
  "ANT BGL",
  "SHEET STUD",
];

const blankItem = (): EstimateItem => ({
  id: crypto.randomUUID(),
  particulars: "",
  pcs: "",
  gross: "",
  tare: "",
  touch: "",
  mcRate: "",
  details: "",
});

const nextEstimateNumber = (estimates: SavedEstimate[], date = new Date()) => {
  const prefix = `S${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
  const sequence = estimates.reduce((max, estimate) => {
    if (!estimate.number.startsWith(prefix)) return max;
    const suffix = Number(estimate.number.slice(prefix.length));
    return Number.isFinite(suffix) ? Math.max(max, suffix) : max;
  }, 0) + 1;
  return `${prefix}${String(sequence).padStart(3, "0")}`;
};

const currency = (value: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const numericValue = (value: string) => {
  if (value.trim() === "") return 0;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.max(0, parsed) : 0;
};

const finiteCalculation = (value: number) => Number.isFinite(value) ? value : 0;

const touchValue = (value: string) => Math.min(100, numericValue(value));

const round = (value: number, digits = 3) =>
  Number.isFinite(value) ? Number(value.toFixed(digits)) : 0;

function NavigationButton({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: typeof LayoutDashboard;
  label: string;
  count?: number;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button className={`nav-item ${active ? "active" : ""}`} onClick={onClick}>
      <Icon size={18} strokeWidth={1.8} />
      <span>{label}</span>
      {count !== undefined && <span className="nav-count">{count}</span>}
    </button>
  );
}

export default function Home() {
  const currentUserRole: "owner" | "staff" = "owner";
  const canManageCustomers = currentUserRole === "owner";
  const [activePage, setActivePage] = useState("Overview");
  const [customers, setCustomers] = useState(initialCustomers);
  const [estimates, setEstimates] = useState(initialEstimates);
  const [dataReady, setDataReady] = useState(false);
  const [items, setItems] = useState<EstimateItem[]>([]);
  const [boardRate, setBoardRate] = useState("");
  const [estimateNumber, setEstimateNumber] = useState(() => {
    const today = new Date();
    return `S${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}001`;
  });
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [customerQuery, setCustomerQuery] = useState("");
  const [showCustomerPicker, setShowCustomerPicker] = useState(false);
  const [showCustomerForm, setShowCustomerForm] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [customerForm, setCustomerForm] = useState({ name: "", phone: "", address: "", gstin: "" });
  const [settlement, setSettlement] = useState<Settlement>({
    mode: "hybrid",
    cash: "",
    bank: "",
    returnWeight: "",
    returnTouch: "",
    discount: "",
  });
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      const saved = window.localStorage.getItem("ssj-estimation-data");
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Partial<StoredData>;
          if (Array.isArray(parsed.customers) && Array.isArray(parsed.estimates)) {
            const restoredCustomers = parsed.customers.filter((entry) => !/^c[1-5]$/.test(entry.id));
            const customerNames = new Set(restoredCustomers.map((entry) => entry.name.toLocaleLowerCase()));
            const restoredEstimates = parsed.estimates.filter((entry) =>
              !/^e[1-4]$/.test(entry.id) && customerNames.has(entry.customer.toLocaleLowerCase()),
            );
            setCustomers(restoredCustomers);
            setEstimates(restoredEstimates);
            setEstimateNumber(nextEstimateNumber(restoredEstimates));
          }
        } catch {
          setNotice("Saved browser data could not be read. Restore your records from a backup.");
        }
      }
      setDataReady(true);
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setCurrentDate(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!dataReady) return;
    window.localStorage.setItem("ssj-estimation-data", JSON.stringify({ customers, estimates }));
  }, [customers, estimates, dataReady]);

  const customer = customers.find((entry) => entry.id === selectedCustomer);
  const marketRate = numericValue(boardRate);
  const totals = useMemo(() => items.reduce(
    (sum, item) => {
      const gross = numericValue(item.gross);
      const net = finiteCalculation(Math.max(0, gross - numericValue(item.tare)));
      const pure = finiteCalculation(net * touchValue(item.touch) / 100);
      const silverCost = finiteCalculation(pure * marketRate);
      const makingCharges = finiteCalculation(net * numericValue(item.mcRate));
      const amount = finiteCalculation(silverCost + makingCharges);
      return {
        gross: finiteCalculation(sum.gross + gross),
        net: finiteCalculation(sum.net + net),
        pure: finiteCalculation(sum.pure + pure),
        silverCost: finiteCalculation(sum.silverCost + silverCost),
        makingCharges: finiteCalculation(sum.makingCharges + makingCharges),
        amount: finiteCalculation(sum.amount + amount),
      };
    },
    { gross: 0, net: 0, pure: 0, silverCost: 0, makingCharges: 0, amount: 0 },
  ), [items, marketRate]);
  const returnPureWeight = finiteCalculation(numericValue(settlement.returnWeight) * touchValue(settlement.returnTouch) / 100);
  const metalCredit = finiteCalculation(returnPureWeight * marketRate);
  const appliedMetalCredit = settlement.mode === "cash" ? 0 : metalCredit;
  const appliedReturnPureWeight = settlement.mode === "cash" ? 0 : returnPureWeight;
  const discount = numericValue(settlement.discount);
  const netPayable = finiteCalculation(Math.max(0, totals.amount - appliedMetalCredit - discount));
  const cashPaid = settlement.mode === "silver" ? 0 : numericValue(settlement.cash);
  const bankPaid = settlement.mode === "silver" ? 0 : numericValue(settlement.bank);
  const totalCashPaid = finiteCalculation(cashPaid + bankPaid);
  const balanceDue = finiteCalculation(netPayable - totalCashPaid);

  const currentDateLabel = new Intl.DateTimeFormat("en-GB", {
    weekday: "long",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(currentDate);
  const suggestedEstimateNumber = nextEstimateNumber(estimates, currentDate);
  const filteredCustomers = customers.filter((entry) =>
    `${entry.name} ${entry.phone}`.toLowerCase().includes(customerQuery.toLowerCase()),
  );
  const filteredEstimates = estimates.filter((entry) =>
    `${entry.number} ${entry.customer}`.toLowerCase().includes(search.toLowerCase()),
  );

  function updateItem(id: string, field: keyof EstimateItem, value: string) {
    setItems((current) => current.map((item) => {
      if (item.id !== id) return item;
      return { ...item, [field]: value };
    }));
  }

  function updateSettlement(field: Exclude<keyof Settlement, "mode">, value: string) {
    setSettlement((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function changeSettlementMode(value: string) {
    if (value !== "cash" && value !== "silver" && value !== "hybrid") return;
    const mode: Settlement["mode"] = value;
    setSettlement((current) => ({
      ...current,
      mode,
      cash: mode === "silver" ? "" : current.cash,
      bank: mode === "silver" ? "" : current.bank,
      returnWeight: mode === "cash" ? "" : current.returnWeight,
    }));
  }

  function saveEstimate() {
    if (!customer) {
      setNotice("Select a customer before saving this estimate.");
      return;
    }
    if (totals.gross <= 0) {
      setNotice("Enter a gross weight before saving this estimate.");
      return;
    }
    if (!estimateNumber.trim()) {
      setNotice("Enter an estimate number before saving.");
      return;
    }
    const estimate: SavedEstimate = {
      id: crypto.randomUUID(),
      number: estimateNumber.trim(),
      customer: customer.name,
      date: currentDateLabel,
      amount: round(netPayable, 2),
      pure: round(totals.pure),
      gross: round(totals.gross),
      status: "Estimate",
    };
    const updatedEstimates = [estimate, ...estimates];
    setEstimates(updatedEstimates);
    setEstimateNumber(nextEstimateNumber(updatedEstimates));
    setNotice(`Estimate ${estimate.number} saved successfully.`);
  }

  function openCustomerForm(entry?: Customer) {
    if (!canManageCustomers) return;
    setEditingCustomerId(entry?.id ?? null);
    setCustomerForm({
      name: entry?.name ?? "",
      phone: entry?.phone ?? "",
      address: entry?.address ?? "",
      gstin: entry?.gstin ?? "",
    });
    setShowCustomerPicker(false);
    setShowCustomerForm(true);
  }

  function saveCustomer() {
    if (!canManageCustomers) {
      setNotice("Only an Admin or Owner can manage customer records.");
      return;
    }
    const name = customerForm.name.trim();
    if (!name) {
      setNotice("Enter a customer name before saving.");
      return;
    }

    if (editingCustomerId) {
      setCustomers((current) => current.map((entry) => entry.id === editingCustomerId
        ? { ...entry, ...customerForm, name, phone: customerForm.phone.trim(), address: customerForm.address.trim(), gstin: customerForm.gstin.trim() }
        : entry));
      setNotice(`${name}'s details were updated.`);
    } else {
      const entry: Customer = {
        id: crypto.randomUUID(),
        ...customerForm,
        name,
        phone: customerForm.phone.trim(),
        address: customerForm.address.trim(),
        gstin: customerForm.gstin.trim(),
        balancePure: 0,
        balanceCash: 0,
      };
      setCustomers((current) => [entry, ...current]);
      setSelectedCustomer(entry.id);
      setNotice(`${entry.name} was added to the customer book.`);
    }
    setCustomerQuery("");
    setShowCustomerForm(false);
  }

  function exportCsv() {
    const rows = [
      ["Estimate No", "Date", "Customer", "Gross Weight (g)", "Pure Weight (g)", "Amount (INR)", "Status"],
      ...estimates.map((entry) => [entry.number, entry.date, entry.customer, entry.gross.toFixed(3), entry.pure.toFixed(3), entry.amount.toFixed(2), entry.status]),
    ];
    const csv = rows.map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob(["\uFEFF", csv], { type: "text/csv;charset=utf-8" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "SSJ_Estimation_Sales_Register.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice("Sales register exported as CSV.");
  }

  async function savePenDriveBackup() {
    const backup = JSON.stringify({
      exportedAt: new Date().toISOString(),
      customers,
      estimates,
    }, null, 2);
    const picker = (window as Window & {
      showDirectoryPicker?: () => Promise<FileSystemDirectoryHandle>;
    }).showDirectoryPicker;
    if (!picker) {
      const url = URL.createObjectURL(new Blob([backup], { type: "application/json" }));
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "SSJ_Estimation_Backup.json";
      anchor.click();
      URL.revokeObjectURL(url);
      setNotice("Your browser does not support direct USB access. A backup file was downloaded instead.");
      return;
    }
    try {
      const directory = await picker();
      const fileHandle = await directory.getFileHandle("SSJ_Estimation_Backup.json", { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(backup);
      await writable.close();
      setNotice("Backup saved to the selected drive.");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setNotice(`Could not save the backup: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  function printEstimate() {
    window.print();
  }

  return (
    <main className="app-shell">
      <aside className={`sidebar ${mobileNavOpen ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Gem size={21} strokeWidth={1.8} /></div>
          <div>
            <div className="brand-name">SSJ <span>ESTIMATION</span></div>
            <div className="brand-caption">JEWELLERY WORKSPACE</div>
          </div>
          <button className="icon-button sidebar-close" aria-label="Close menu" onClick={() => setMobileNavOpen(false)}><X size={18} /></button>
        </div>

        <div className="shop-switcher">
          <div className="shop-avatar">S</div>
          <div className="shop-copy"><strong>Siva Surya Jewellers</strong><span>Coimbatore · Main branch</span></div>
          <ChevronDown size={15} className="muted-icon" />
        </div>

        <div className="nav-section-label">WORKSPACE</div>
        <nav className="navigation">
          <NavigationButton icon={LayoutDashboard} label="Overview" active={activePage === "Overview"} onClick={() => setActivePage("Overview")} />
          <NavigationButton icon={FileText} label="Estimation" active={activePage === "Estimation"} onClick={() => setActivePage("Estimation")} />
          <NavigationButton icon={Users} label="Customers" count={customers.length} active={activePage === "Customers"} onClick={() => setActivePage("Customers")} />
          <NavigationButton icon={BookOpen} label="Ledger" active={activePage === "Ledger"} onClick={() => setActivePage("Ledger")} />
          <NavigationButton icon={BriefcaseBusiness} label="Inventory" active={activePage === "Inventory"} onClick={() => setActivePage("Inventory")} />
        </nav>
        <div className="nav-section-label nav-section-spaced">MANAGE</div>
        <nav className="navigation">
          <NavigationButton icon={ArrowUpRight} label="Reports" active={activePage === "Reports"} onClick={() => setActivePage("Reports")} />
          <NavigationButton icon={Settings} label="Settings" active={activePage === "Settings"} onClick={() => setActivePage("Settings")} />
        </nav>

        <div className="sidebar-bottom">
          <div className="secure-card">
            <div className="secure-icon"><ShieldCheck size={17} /></div>
            <div><strong>Your workspace</strong><span>Local device storage</span></div>
            <span className="online-dot" />
          </div>
          <div className="profile">
            <div className="profile-avatar">SS</div>
            <div className="profile-copy"><strong>Siva Surya</strong><span>Owner account</span></div>
            <MoreHorizontal size={19} className="muted-icon" />
          </div>
        </div>
      </aside>

      <section className="main-column">
        <header className="topbar">
          <div className="topbar-left">
            <button className="icon-button menu-button" aria-label="Open menu" onClick={() => setMobileNavOpen(true)}><Menu size={19} /></button>
            <div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{activePage}</strong></div>
          </div>
          <div className="topbar-actions">
            <div className="fy-pill"><span className="fy-dot" /> FY 2026–27 <ChevronDown size={14} /></div>
            <div className="topbar-divider" />
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="topbar-date"><CalendarDays size={15} /><span>{currentDateLabel}</span></div>
          </div>
        </header>

        <div className="page-content">
          <div className="welcome-row">
            <div>
              <div className="eyebrow"><Sparkles size={13} /> YOUR BUSINESS AT A GLANCE</div>
              <h1>Good morning, Siva <span className="wave">✳</span></h1>
              <p className="welcome-subtitle">Here&apos;s what&apos;s happening at your store today.</p>
            </div>
            <button className="button button-primary" onClick={() => { setActivePage("Estimation"); setMobileNavOpen(false); }}>
              <Plus size={17} /> New estimation
            </button>
          </div>

          <section className="metrics-grid">
            <article className="metric-card">
              <div className="metric-top"><span>Saved estimate value</span><span className="metric-icon teal"><Wallet size={18} /></span></div>
              <strong className="metric-value">{currency(estimates.reduce((sum, entry) => sum + entry.amount, 0))}</strong>
              <div className="metric-bottom"><span>Across saved estimates</span></div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Estimates made</span><span className="metric-icon violet"><FileText size={18} /></span></div>
              <strong className="metric-value">{estimates.length} <small>saved</small></strong>
              <div className="metric-bottom"><span>Estimate register</span></div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Pure silver handled</span><span className="metric-icon amber"><Gem size={18} /></span></div>
              <strong className="metric-value">{round(estimates.reduce((sum, entry) => sum + entry.pure, 0)).toFixed(3)} <small>g</small></strong>
              <div className="metric-bottom"><span>Across saved estimates</span></div>
            </article>
            <article className="metric-card">
              <div className="metric-top"><span>Active customers</span><span className="metric-icon blue"><Users size={18} /></span></div>
              <strong className="metric-value">{customers.length}</strong>
              <div className="metric-bottom"><span>In your customer book</span></div>
            </article>
          </section>

          {notice && <div className="notice" role="status"><Check size={15} />{notice}<button aria-label="Dismiss notice" onClick={() => setNotice("")}><X size={15} /></button></div>}

          <div className="dashboard-grid">
            <section className={`panel estimate-panel ${activePage === "Estimation" ? "focused-panel" : ""}`} id="estimate">
              <div className="panel-heading">
                <div><h2>{activePage === "Estimation" ? "New estimation" : "Quick estimation"}</h2><p>Create a new jewellery estimate for your customer</p></div>
                <span className="draft-badge"><span /> DRAFT</span>
              </div>

              <div className="estimate-meta">
                <div className="customer-select-wrap">
                  <label>Customer name <span className="required">*</span></label>
                  <button className="customer-select" onClick={() => setShowCustomerPicker(!showCustomerPicker)}>
                    <Users size={15} /><span>{customer?.name ?? "Search or Add Customer"}</span><ChevronDown size={15} />
                  </button>
                  {showCustomerPicker && <div className="customer-dropdown">
                    <div className="dropdown-search"><Search size={14} /><input autoFocus value={customerQuery} onChange={(event) => setCustomerQuery(event.target.value)} placeholder="Search customers" /></div>
                    <div className="customer-options">{filteredCustomers.map((entry) => <div className="customer-option-row" key={entry.id}><button className="customer-option-select" onClick={() => { setSelectedCustomer(entry.id); setShowCustomerPicker(false); setCustomerQuery(""); }}><span className="customer-option-avatar">{entry.name.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><span><strong>{entry.name}</strong><small>{entry.phone}</small></span><ChevronRight size={14} /></button>{canManageCustomers && <button className="customer-edit-button" aria-label={`Edit ${entry.name}`} title="Edit customer" onClick={() => openCustomerForm(entry)}><Pencil size={13} /></button>}</div>)}{filteredCustomers.length === 0 && <div className="empty-search">{customers.length === 0 ? "No customers yet. Add one to get started." : "No customers found."}</div>}</div>
                    {canManageCustomers && <button className="add-customer-option" onClick={() => openCustomerForm()}><Plus size={14} /> Add New Customer</button>}
                  </div>}
                </div>
                <label className="meta-field"><span className="field-label">Estimate no.</span><input className="meta-input" type="text" value={estimateNumber} onChange={(event) => setEstimateNumber(event.target.value)} placeholder={suggestedEstimateNumber} autoComplete="off" /></label>
                <div className="meta-field live-date-field"><span className="field-label">Date &amp; day</span><div className="live-date-display"><CalendarDays size={15} /><span>{currentDateLabel}</span></div></div>
                <label className="meta-field board-rate-field"><span className="field-label">Board Rate (₹/g)</span><input aria-label="Board Rate ₹ per gram" className="meta-input" type="number" min="0" step="0.01" value={boardRate} onChange={(event) => setBoardRate(event.target.value)} placeholder="0.00" /></label>
              </div>

              <div className="previous-balances">
                <span className="balance-label">Previous balance</span>
                <span className="balance-item"><Gem size={14} /> Pure silver <strong>{customer?.balancePure.toFixed(3) ?? "0.000"} g</strong></span>
                <span className="balance-separator" />
                <span className="balance-item"><Wallet size={14} /> Cash <strong>{currency(customer?.balanceCash ?? 0)}</strong></span>
                <button className="icon-button help-button" title="Customer's previous closing balance"><CircleHelp size={15} /></button>
              </div>

              <div className="table-scroller">
                <table className="estimate-table">
                  <thead><tr><th className="sno-col">#</th><th className="particular-col">Particulars</th><th>PCS</th><th>G.Wg <small>g</small></th><th>Cover <small>g</small></th><th>Silver touch <small>%</small></th><th>Pure silver <small>g</small></th><th>MC rate <small>₹/g</small></th><th>Amount <small>₹</small></th><th>Details</th><th /></tr></thead>
                  <tbody>{items.length === 0 ? <tr><td colSpan={11} className="empty-billing">No items yet. Add an item row to begin this silver estimate.</td></tr> : items.map((item, index) => {
                    const gross = numericValue(item.gross);
                    const net = finiteCalculation(Math.max(0, gross - numericValue(item.tare)));
                    const pure = finiteCalculation(net * touchValue(item.touch) / 100);
                    const amount = finiteCalculation(pure * marketRate + net * numericValue(item.mcRate));
                    return <tr key={item.id}>
                      <td className="sno-cell">{String(index + 1).padStart(2, "0")}</td>
                      <td><select aria-label={`Particulars row ${index + 1}`} className="item-select" value={item.particulars} onChange={(event) => updateItem(item.id, "particulars", event.target.value)}><option value="">Select item</option>{particularsOptions.map((option) => <option key={option}>{option}</option>)}</select></td>
                      <td><input aria-label={`Pieces row ${index + 1}`} type="number" min="0" value={item.pcs} placeholder="0" onChange={(event) => updateItem(item.id, "pcs", event.target.value)} /></td>
                      <td><input aria-label={`Gross weight row ${index + 1}`} type="number" min="0" step="0.001" value={item.gross} placeholder="0.000" onChange={(event) => updateItem(item.id, "gross", event.target.value)} /></td>
                      <td><input aria-label={`Cover tare row ${index + 1}`} type="number" min="0" step="0.001" value={item.tare} placeholder="0.000" onChange={(event) => updateItem(item.id, "tare", event.target.value)} /></td>
                      <td><input aria-label={`Touch Mapping A.Touch row ${index + 1}`} className="manual-touch-input" type="number" min="0" max="100" step="0.01" value={item.touch} placeholder="0.00" onChange={(event) => updateItem(item.id, "touch", event.target.value)} /></td>
                      <td className="computed-cell">{pure.toFixed(3)}</td>
                      <td><input aria-label={`Making charge rate row ${index + 1}`} type="number" min="0" step="0.01" value={item.mcRate} placeholder="0.00" onChange={(event) => updateItem(item.id, "mcRate", event.target.value)} /></td>
                      <td className="amount-cell">{amount.toFixed(2)}</td>
                      <td><input aria-label={`Details row ${index + 1}`} className="details-input" value={item.details} onChange={(event) => updateItem(item.id, "details", event.target.value)} placeholder="Add note" /></td>
                      <td><button className="row-remove" aria-label={`Remove row ${index + 1}`} onClick={() => setItems((current) => current.filter((entry) => entry.id !== item.id))}><X size={14} /></button></td>
                    </tr>;
                  })}</tbody>
                  <tfoot><tr><td colSpan={3} className="total-label">TOTAL</td><td>{totals.gross.toFixed(3)}</td><td>{(totals.gross - totals.net).toFixed(3)}</td><td>—</td><td>{totals.pure.toFixed(3)}</td><td>{currency(totals.makingCharges)}</td><td className="total-amount">{currency(totals.amount)}</td><td colSpan={2} /></tr></tfoot>
                </table>
              </div>

              <button className="add-row-button" onClick={() => setItems((current) => [...current, blankItem()])}><Plus size={15} /> Add item row</button>

              <div className="settlement-section">
                <div className="settlement-heading"><div><h3>Settlement &amp; Adjustments</h3><span>Choose how the customer is settling this estimate</span></div><span className="optional-tag">LIVE</span></div>
                <label className="settlement-mode-field"><span>Settlement mode</span><select aria-label="Settlement mode" value={settlement.mode} onChange={(event) => changeSettlementMode(event.target.value)}><option value="cash">Cash only</option><option value="silver">Silver exchange only</option><option value="hybrid">Hybrid / split settlement</option></select></label>
                <div className="settlement-fields">
                  {settlement.mode !== "cash" && <>
                    <label className="settle-field"><span><Gem size={14} /> Customer return weight</span><div><input aria-label="Customer return weight" type="number" min="0" step="0.001" value={settlement.returnWeight} onChange={(event) => updateSettlement("returnWeight", event.target.value)} placeholder="0.000" /><span className="unit-suffix">g</span></div></label>
                    <label className="settle-field"><span><Gem size={14} /> Touch Mapping / A.Touch</span><div><input aria-label="Return metal touch mapping" type="number" min="0" max="100" step="0.01" value={settlement.returnTouch} onChange={(event) => updateSettlement("returnTouch", event.target.value)} placeholder="0.00" /><span className="unit-suffix">%</span></div></label>
                    <div className="settle-field settlement-computed"><span>Customer pure weight</span><strong>{returnPureWeight.toFixed(3)} g</strong></div>
                    <div className="settle-field settlement-computed"><span>Rate cut metal credit</span><strong>{currency(metalCredit)}</strong></div>
                  </>}
                  {settlement.mode !== "silver" && <>
                    <label className="settle-field"><span><Wallet size={14} /> Cash paid</span><div><span>₹</span><input aria-label="Cash paid" type="number" min="0" step="0.01" value={settlement.cash} onChange={(event) => updateSettlement("cash", event.target.value)} placeholder="0.00" /></div></label>
                    <label className="settle-field"><span><ArrowUpRight size={14} /> Bank / UPI paid</span><div><span>₹</span><input aria-label="Bank UPI paid" type="number" min="0" step="0.01" value={settlement.bank} onChange={(event) => updateSettlement("bank", event.target.value)} placeholder="0.00" /></div></label>
                  </>}
                  <label className="settle-field"><span><Wallet size={14} /> Discount (₹)</span><div><span>₹</span><input aria-label="Discount rupees" type="number" min="0" step="0.01" value={settlement.discount} onChange={(event) => updateSettlement("discount", event.target.value)} placeholder="0.00" /></div></label>
                </div>
                <div className="settlement-breakdown">
                  <div><span>Sales pure metal cost</span><strong>{currency(totals.silverCost)}</strong></div>
                  <div><span>Making charges</span><strong>+ {currency(totals.makingCharges)}</strong></div>
                  <div><span>Item amount</span><strong>{currency(totals.amount)}</strong></div>
                  {settlement.mode !== "cash" && <div><span>Metal credit</span><strong>− {currency(appliedMetalCredit)}</strong></div>}
                  <div><span>Discount</span><strong>− {currency(discount)}</strong></div>
                  <div className="breakdown-total"><span>Net payable</span><strong>{currency(netPayable)}</strong></div>
                  {settlement.mode !== "silver" && <div><span>Cash + Bank / UPI paid</span><strong>− {currency(totalCashPaid)}</strong></div>}
                  <div className="breakdown-due"><span>Balance due</span><strong>{currency(balanceDue)}</strong></div>
                </div>
              </div>

              <div className="estimate-footer">
                <div className="balance-summary"><div><span>Sales pure silver</span><strong>{totals.pure.toFixed(3)} <small>g</small></strong></div><div><span>Return pure silver</span><strong>{appliedReturnPureWeight.toFixed(3)} <small>g</small></strong></div><div><span>Balance due</span><strong>{currency(balanceDue)}</strong></div></div>
                <div className="estimate-actions"><button className="button button-secondary" onClick={printEstimate}><Printer size={16} /> Print</button><button className="button button-primary" onClick={saveEstimate}><Check size={16} /> Save estimate</button></div>
              </div>
            </section>

            <aside className="right-column">
              <section className="panel activity-panel">
                <div className="side-panel-heading"><div><h2>Recent estimates</h2><span className="activity-count">{estimates.length} total</span></div><button className="icon-button" aria-label="More estimates"><MoreHorizontal size={19} /></button></div>
                <div className="activity-list">{estimates.length === 0 ? <div className="activity-empty">No saved estimates yet.</div> : estimates.slice(0, 4).map((entry) => <div className="activity-item" key={entry.id}><div className={`activity-avatar avatar-${entry.customer.charCodeAt(0) % 4}`}>{entry.customer.split(" ").map((part) => part[0]).slice(0, 2).join("")}</div><div className="activity-detail"><strong>{entry.customer}</strong><span>{entry.number} · {entry.date}</span></div><div className="activity-amount"><strong>{currency(entry.amount)}</strong><span className={`status-badge ${entry.status === "Billed" ? "status-billed" : "status-estimate"}`}>{entry.status}</span></div></div>)}</div>
                <button className="view-all-button" onClick={() => setActivePage("Ledger")}>View all estimates <ChevronRight size={15} /></button>
              </section>

              <section className="backup-card">
                <div className="backup-icon"><Download size={17} /></div>
                <div className="backup-copy"><strong>Keep your data safe</strong><span>Save a copy of your records</span></div>
                <button className="backup-action" onClick={savePenDriveBackup} title="Save backup to USB drive">Back up <ChevronRight size={14} /></button>
              </section>
              <div className="daily-note"><span><Sparkles size={13} /></span><p><strong>Day-end reminder</strong> Remember to back up today&apos;s records before you close the shop.</p></div>
            </aside>
          </div>

          <section className="panel ledger-panel" id="ledger">
            <div className="ledger-heading"><div><div className="ledger-title-line"><h2>{activePage === "Customers" ? "Customer book" : activePage === "Ledger" ? "Customer ledger" : "Recent transactions"}</h2><span className="ledger-live"><i /> LIVE</span></div><p>Your latest customer estimates and billing activity</p></div>
              <div className="ledger-tools"><div className="table-search"><Search size={15} /><input aria-label="Search estimates" placeholder="Search estimates..." value={search} onChange={(event) => setSearch(event.target.value)} /></div><button className="button button-export" onClick={exportCsv}><Download size={15} /> Export</button><button className="icon-button filter-button" aria-label="Filter estimates"><ChevronDown size={17} /></button></div>
            </div>
            <div className="ledger-table-wrap"><table className="ledger-table"><thead><tr><th>ESTIMATE NO.</th><th>CUSTOMER</th><th>DATE</th><th>GROSS WT.</th><th>PURE SILVER WT.</th><th>AMOUNT</th><th>STATUS</th><th /></tr></thead><tbody>{filteredEstimates.slice(0, 5).map((entry) => <tr key={entry.id}><td className="invoice-number">{entry.number}</td><td><span className="ledger-customer-avatar">{entry.customer.split(" ").map((part) => part[0]).slice(0, 2).join("")}</span><strong className="ledger-customer-name">{entry.customer}</strong></td><td>{entry.date}</td><td>{entry.gross.toFixed(3)} <small>g</small></td><td>{entry.pure.toFixed(3)} <small>g</small></td><td className="ledger-amount">{currency(entry.amount)}</td><td><span className={`status-badge ${entry.status === "Billed" ? "status-billed" : "status-estimate"}`}>{entry.status}</span></td><td><button className="icon-button row-menu" aria-label={`Options for ${entry.number}`}><MoreHorizontal size={17} /></button></td></tr>)}
              {filteredEstimates.length === 0 && <tr><td colSpan={8} className="empty-table">{estimates.length === 0 ? "No saved estimates yet." : "No estimates match your search."}</td></tr>}</tbody></table></div>
            <div className="ledger-footer"><span>Showing <strong>{Math.min(filteredEstimates.length, 5)}</strong> of <strong>{filteredEstimates.length}</strong> estimates</span><div className="pagination"><button aria-label="Previous page" disabled><ChevronLeft size={15} /></button><button className="page-current">1</button><button aria-label="Next page" disabled><ChevronRight size={15} /></button></div></div>
          </section>

          <footer className="app-footer"><span>© {currentDate.getFullYear()} SSJ Estimation</span><span><span className="footer-status" /> All changes saved on this device</span><span>Financial year {currentDate.getMonth() >= 3 ? currentDate.getFullYear() : currentDate.getFullYear() - 1}–{String((currentDate.getMonth() >= 3 ? currentDate.getFullYear() : currentDate.getFullYear() - 1) + 1).slice(-2)}</span></footer>
        </div>
      </section>
      {showCustomerForm && canManageCustomers && <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowCustomerForm(false); }}>
        <section className="customer-modal" role="dialog" aria-modal="true" aria-labelledby="customer-modal-title">
          <div className="customer-modal-heading"><div><span className="modal-icon"><Users size={18} /></span><div><h2 id="customer-modal-title">{editingCustomerId ? "Edit customer" : "Add new customer"}</h2><p>Customer records are saved to this device.</p></div></div><button className="icon-button" aria-label="Close customer form" onClick={() => setShowCustomerForm(false)}><X size={18} /></button></div>
          <form onSubmit={(event) => { event.preventDefault(); saveCustomer(); }}>
            <label className="customer-form-field"><span>Customer name <i>*</i></span><input autoFocus required value={customerForm.name} onChange={(event) => setCustomerForm({ ...customerForm, name: event.target.value })} placeholder="Enter full name" /></label>
            <label className="customer-form-field"><span>Phone number</span><input type="tel" value={customerForm.phone} onChange={(event) => setCustomerForm({ ...customerForm, phone: event.target.value })} placeholder="Enter phone number" /></label>
            <label className="customer-form-field"><span>Address</span><textarea rows={2} value={customerForm.address} onChange={(event) => setCustomerForm({ ...customerForm, address: event.target.value })} placeholder="Enter customer address" /></label>
            <label className="customer-form-field"><span>GSTIN</span><input value={customerForm.gstin} onChange={(event) => setCustomerForm({ ...customerForm, gstin: event.target.value.toUpperCase() })} placeholder="Optional GSTIN" maxLength={15} /></label>
            <div className="customer-modal-actions"><button type="button" className="button button-secondary" onClick={() => setShowCustomerForm(false)}>Cancel</button><button type="submit" className="button button-primary"><Check size={15} />{editingCustomerId ? "Save changes" : "Save customer"}</button></div>
          </form>
        </section>
      </div>}
    </main>
  );
}
