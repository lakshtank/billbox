import React, { useState } from 'react';
import {
  Mail,
  Key,
  ShieldCheck,
  Server,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import api from '@/api/axios';
import toast from '@/lib/toast';

export function SmtpConfigModal({ open, onClose, userEmail = '', onConfigured = null }) {
  const [provider, setProvider] = useState('gmail'); // 'gmail' | 'custom'
  const [host, setHost] = useState('smtp.gmail.com');
  const [port, setPort] = useState('465');
  const [user, setUser] = useState(userEmail || '');
  const [pass, setPass] = useState('');
  const [from, setFrom] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);

  if (!open) return null;

  const handleProviderChange = (p) => {
    setProvider(p);
    if (p === 'gmail') {
      setHost('smtp.gmail.com');
      setPort('465');
      if (!from && user) setFrom(`"BillBox Vault" <${user}>`);
    } else {
      setHost('');
      setPort('587');
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!host || !user || !pass) {
      toast.error('Host, user email, and password are required.');
      return;
    }

    setIsVerifying(true);
    try {
      const res = await api.post('/reminders/configure-smtp', {
        host: host.trim(),
        port: Number(port) || 465,
        user: user.trim(),
        pass: pass.trim().replace(/\s+/g, ''), // Strip spaces from Gmail app passwords
        from: from.trim() || `"BillBox Vault" <${user.trim()}>`,
      });

      toast.success(res.data?.message || 'SMTP verified and connected!');
      if (onConfigured) onConfigured();
      onClose();
    } catch (err) {
      const msg = err.response?.data?.message || 'Could not verify SMTP connection.';
      toast.error(msg);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-surface text-fg border border-line shadow-2xl p-6 rounded-3xl max-h-[92vh] overflow-y-auto font-sans">
        <DialogHeader className="space-y-1 pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <div className="size-9 rounded-xl bg-accent-tint border border-accent/20 flex items-center justify-center text-accent">
              <Mail className="size-4.5" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-fg">Configure Live Email Delivery</DialogTitle>
              <DialogDescription className="text-xs text-fg-3">
                Connect your mail server to receive genuine warranty alert emails in your personal inbox.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Provider Switcher Tabs */}
        <div className="grid grid-cols-2 gap-2 my-2 bg-subtle p-1 rounded-xl border border-line-subtle text-xs font-semibold">
          <button
            type="button"
            onClick={() => handleProviderChange('gmail')}
            className={`py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              provider === 'gmail'
                ? 'bg-surface text-fg shadow-xs border border-line font-bold'
                : 'text-fg-3 hover:text-fg'
            }`}
          >
            <span>Gmail (App Password)</span>
            <Badge variant="accent" className="text-[10px] px-1.5 py-0">Recommended</Badge>
          </button>
          <button
            type="button"
            onClick={() => handleProviderChange('custom')}
            className={`py-2 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              provider === 'custom'
                ? 'bg-surface text-fg shadow-xs border border-line font-bold'
                : 'text-fg-3 hover:text-fg'
            }`}
          >
            <Server className="size-3" />
            <span>Custom SMTP / SendGrid</span>
          </button>
        </div>

        {provider === 'gmail' && (
          <div className="p-3.5 rounded-xl bg-accent-tint/40 border border-accent/20 space-y-2 text-xs">
            <div className="flex items-center gap-1.5 font-semibold text-accent">
              <ShieldCheck className="size-4 shrink-0" />
              <span>How to use Gmail with BillBox:</span>
            </div>
            <ol className="list-decimal pl-4 space-y-1 text-fg-2 text-[11px] leading-relaxed">
              <li>Open your Google Account and ensure 2-Step Verification is ON.</li>
              <li>
                Visit{' '}
                <a
                  href="https://myaccount.google.com/apppasswords"
                  target="_blank"
                  rel="noreferrer"
                  className="font-semibold underline text-accent inline-flex items-center gap-0.5"
                >
                  myaccount.google.com/apppasswords
                  <ExternalLink className="size-2.5" />
                </a>
              </li>
              <li>Create an app named <strong>"BillBox"</strong> to get a 16-character password.</li>
              <li>Paste it below — BillBox will verify and deliver real emails to your Gmail inbox!</li>
            </ol>
          </div>
        )}

        <form onSubmit={handleSave} className="space-y-3.5 pt-1">
          {provider === 'custom' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-xs font-medium text-fg block mb-1">SMTP Host *</label>
                <Input
                  type="text"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  placeholder="smtp.sendgrid.net"
                  className="h-8 text-xs font-mono"
                  required
                />
              </div>
              <div>
                <label className="text-xs font-medium text-fg block mb-1">Port</label>
                <Input
                  type="text"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  placeholder="587"
                  className="h-8 text-xs font-mono"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-fg block mb-1">
              {provider === 'gmail' ? 'Your Gmail Address *' : 'SMTP Username / Email *'}
            </label>
            <Input
              type="email"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              placeholder="your_email@gmail.com"
              className="h-8 text-xs font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-fg block mb-1">
              {provider === 'gmail' ? '16-Character Google App Password *' : 'SMTP Password / API Key *'}
            </label>
            <Input
              type="password"
              value={pass}
              onChange={(e) => setPass(e.target.value)}
              placeholder={provider === 'gmail' ? 'xxxx xxxx xxxx xxxx' : '••••••••••••'}
              className="h-8 text-xs font-mono"
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-fg block mb-1">From Name & Address (Optional)</label>
            <Input
              type="text"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              placeholder={user ? `"BillBox Vault" <${user}>` : '"BillBox Vault" <noreply@billbox.com>'}
              className="h-8 text-xs font-mono"
            />
          </div>

          <div className="pt-2 flex items-center justify-end gap-2 border-t border-line-subtle">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isVerifying}
              className="text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isVerifying}
              className="text-xs bg-accent hover:bg-accent/90 text-white gap-1.5 font-medium shadow-xs"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="size-3.5 animate-spin" />
                  <span>Verifying Connection...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="size-3.5" />
                  <span>Verify & Save Connection</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
