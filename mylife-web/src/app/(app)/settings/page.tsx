'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import {
  User, Lock, Users, Plus, Trash2, Crown, Loader2,
  ShieldCheck, UserPlus, LogOut, TriangleAlert,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import {
  Dialog, DialogContent, DialogHeader, DialogFooter,
  DialogTitle, DialogDescription,
} from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useResetFinancialData } from '@/hooks/use-finance';
import type { FamilyGroupResponse } from '@/types/api';
import {
  useMyFamilyGroup,
  useCreateFamilyGroup,
  useUpdateFamilyGroup,
  useDeleteFamilyGroup,
  useAddFamilyMember,
  useRemoveFamilyMember,
} from '@/hooks/use-family-group';

// ── Schemas ────────────────────────────────────────────────────────────────────

const profileSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres').max(100),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
  newPassword: z.string().min(8, 'Nova senha deve ter pelo menos 8 caracteres'),
  confirmPassword: z.string().min(1, 'Confirme a nova senha'),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'As senhas não coincidem',
  path: ['confirmPassword'],
});
type PasswordForm = z.infer<typeof passwordSchema>;

const groupSchema = z.object({
  name: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
});
type GroupForm = z.infer<typeof groupSchema>;

const memberSchema = z.object({
  email: z.string().email('E-mail inválido'),
});
type MemberForm = z.infer<typeof memberSchema>;

// ── Page ───────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const { user, updateProfile, changePassword, extractMessage } = useAuth();
  const { data: group, isLoading: loadingGroup } = useMyFamilyGroup();

  const isOwner = user?.role === 'OWNER';

  return (
    <div className="mx-auto max-w-2xl space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Gerencie seu perfil, segurança e grupo familiar.
        </p>
      </div>

      {/* Profile */}
      <ProfileSection user={user} updateProfile={updateProfile} extractMessage={extractMessage} />

      {/* Password */}
      <PasswordSection changePassword={changePassword} extractMessage={extractMessage} />

      {/* Family Group */}
      <FamilyGroupSection
        group={group ?? null}
        loading={loadingGroup}
        isOwner={isOwner}
        currentUserId={user?.userId ?? 0}
      />

      {/* Danger Zone */}
      <DangerZoneSection />
    </div>
  );
}

// ── Profile Section ────────────────────────────────────────────────────────────

function ProfileSection({
  user,
  updateProfile,
  extractMessage,
}: {
  user: ReturnType<typeof useAuth>['user'];
  updateProfile: ReturnType<typeof useAuth>['updateProfile'];
  extractMessage: ReturnType<typeof useAuth>['extractMessage'];
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user?.name ?? '' },
  });

  async function onSubmit(data: ProfileForm) {
    setSaving(true);
    try {
      await updateProfile({ name: data.name });
      toast.success('Nome atualizado com sucesso!');
    } catch (err) {
      toast.error(extractMessage(err, 'Erro ao atualizar perfil.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 dark:bg-emerald-500/15">
            <User className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div>
            <CardTitle className="text-base">Perfil</CardTitle>
            <CardDescription>Atualize seu nome de exibição.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="profile-name">Nome</Label>
            <Input id="profile-name" {...register('name')} placeholder="Seu nome" />
            {errors.name && <p className="text-xs text-red-500">{errors.name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>E-mail</Label>
            <Input value={user?.email ?? ''} disabled className="bg-slate-50 dark:bg-white/5 text-slate-400" />
            <p className="text-xs text-slate-400">O e-mail não pode ser alterado.</p>
          </div>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Salvar alterações
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Password Section ───────────────────────────────────────────────────────────

function PasswordSection({
  changePassword,
  extractMessage,
}: {
  changePassword: ReturnType<typeof useAuth>['changePassword'];
  extractMessage: ReturnType<typeof useAuth>['extractMessage'];
}) {
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset, formState: { errors } } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  async function onSubmit(data: PasswordForm) {
    setSaving(true);
    try {
      await changePassword({ currentPassword: data.currentPassword, newPassword: data.newPassword });
      toast.success('Senha alterada com sucesso!');
      reset();
    } catch (err) {
      toast.error(extractMessage(err, 'Erro ao alterar senha.'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-100 dark:bg-violet-500/15">
            <Lock className="h-4 w-4 text-violet-600 dark:text-violet-400" />
          </div>
          <div>
            <CardTitle className="text-base">Segurança</CardTitle>
            <CardDescription>Altere sua senha de acesso.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Senha atual</Label>
            <Input id="current-password" type="password" {...register('currentPassword')} placeholder="••••••••" />
            {errors.currentPassword && <p className="text-xs text-red-500">{errors.currentPassword.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">Nova senha</Label>
            <Input id="new-password" type="password" {...register('newPassword')} placeholder="••••••••" />
            {errors.newPassword && <p className="text-xs text-red-500">{errors.newPassword.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="confirm-password">Confirmar nova senha</Label>
            <Input id="confirm-password" type="password" {...register('confirmPassword')} placeholder="••••••••" />
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>
          <Button type="submit" disabled={saving} className="w-full sm:w-auto">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Alterar senha
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

// ── Family Group Section ───────────────────────────────────────────────────────

function FamilyGroupSection({
  group,
  loading,
  isOwner,
  currentUserId,
}: {
  group: FamilyGroupResponse | null;
  loading: boolean;
  isOwner: boolean;
  currentUserId: number;
}) {
  const createGroup = useCreateFamilyGroup();
  const updateGroup = useUpdateFamilyGroup();
  const deleteGroup = useDeleteFamilyGroup();
  const addMember = useAddFamilyMember();
  const removeMember = useRemoveFamilyMember();

  const [editingName, setEditingName] = useState(false);

  const { register: regGroup, handleSubmit: handleGroup, formState: { errors: errGroup } } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema),
    values: { name: group?.name ?? '' },
  });

  const { register: regMember, handleSubmit: handleMember, reset: resetMember, formState: { errors: errMember } } = useForm<MemberForm>({
    resolver: zodResolver(memberSchema),
  });

  async function onCreateGroup(data: GroupForm) {
    try {
      await createGroup.mutateAsync({ name: data.name });
      toast.success('Grupo familiar criado!');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao criar grupo.');
    }
  }

  async function onRenameGroup(data: GroupForm) {
    if (!group) return;
    try {
      await updateGroup.mutateAsync({ id: group.id, req: { name: data.name } });
      toast.success('Grupo renomeado!');
      setEditingName(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao renomear grupo.');
    }
  }

  async function onDeleteGroup() {
    if (!group) return;
    if (!confirm('Tem certeza que deseja excluir o grupo? Todos os membros serão removidos.')) return;
    try {
      await deleteGroup.mutateAsync(group.id);
      toast.success('Grupo excluído.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao excluir grupo.');
    }
  }

  async function onAddMember(data: MemberForm) {
    if (!group) return;
    try {
      await addMember.mutateAsync({ groupId: group.id, req: { email: data.email } });
      toast.success('Membro adicionado!');
      resetMember();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao adicionar membro.');
    }
  }

  async function onRemoveMember(userId: number) {
    if (!group) return;
    try {
      await removeMember.mutateAsync({ groupId: group.id, userId });
      toast.success('Membro removido.');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao remover membro.');
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-100 dark:bg-sky-500/15">
            <Users className="h-4 w-4 text-sky-600 dark:text-sky-400" />
          </div>
          <div>
            <CardTitle className="text-base">Grupo Familiar</CardTitle>
            <CardDescription>Compartilhe sua conta com até 5 membros.</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando grupo...
          </div>
        ) : group === null ? (
          /* No group yet — create */
          <div className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Você não pertence a nenhum grupo familiar. Crie um para compartilhar suas finanças.
            </p>
            {isOwner ? (
              <form onSubmit={handleGroup(onCreateGroup)} className="flex gap-2">
                <div className="flex-1">
                  <Input {...regGroup('name')} placeholder="Nome do grupo (ex: Família Silva)" />
                  {errGroup.name && <p className="mt-1 text-xs text-red-500">{errGroup.name.message}</p>}
                </div>
                <Button type="submit" disabled={createGroup.isPending}>
                  {createGroup.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  Criar
                </Button>
              </form>
            ) : (
              <p className="text-sm text-amber-600 dark:text-amber-400">
                Apenas usuários com perfil OWNER podem criar grupos. Peça ao OWNER que te adicione.
              </p>
            )}
          </div>
        ) : (
          /* Group exists */
          <div className="space-y-5">
            {/* Group name + actions */}
            <div className="flex items-center justify-between">
              {editingName && isOwner ? (
                <form onSubmit={handleGroup(onRenameGroup)} className="flex flex-1 gap-2 mr-2">
                  <Input {...regGroup('name')} autoFocus />
                  <Button type="submit" size="sm" disabled={updateGroup.isPending}>
                    {updateGroup.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Salvar'}
                  </Button>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setEditingName(false)}>
                    Cancelar
                  </Button>
                </form>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-800 dark:text-slate-100">{group.name}</span>
                  <span className="rounded-full bg-slate-100 dark:bg-white/8 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {group.members.length}/5 membros
                  </span>
                </div>
              )}
              {isOwner && !editingName && (
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditingName(true)}>
                    Renomear
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    onClick={onDeleteGroup}
                    disabled={deleteGroup.isPending}
                  >
                    {deleteGroup.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Trash2 className="h-3 w-3" />}
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Members list */}
            <div className="space-y-2">
              {group.members.map((member) => (
                <div key={member.id} className="flex items-center gap-3 rounded-lg px-3 py-2.5 bg-slate-50 dark:bg-white/4">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white text-xs font-semibold">
                      {member.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-medium text-slate-800 dark:text-slate-100 truncate">
                        {member.name}
                      </span>
                      {member.role === 'OWNER' && (
                        <Crown className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-slate-400 truncate block">{member.email}</span>
                  </div>
                  {isOwner && member.id !== currentUserId && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-red-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 shrink-0"
                      onClick={() => onRemoveMember(member.id)}
                      disabled={removeMember.isPending}
                    >
                      <LogOut className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>

            {/* Add member (OWNER only, under limit) */}
            {isOwner && group.members.length < 5 && (
              <>
                <Separator />
                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <UserPlus className="h-3.5 w-3.5" />
                    Adicionar membro
                  </Label>
                  <form onSubmit={handleMember(onAddMember)} className="flex gap-2">
                    <div className="flex-1">
                      <Input {...regMember('email')} type="email" placeholder="email@exemplo.com" />
                      {errMember.email && <p className="mt-1 text-xs text-red-500">{errMember.email.message}</p>}
                    </div>
                    <Button type="submit" disabled={addMember.isPending}>
                      {addMember.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                      Adicionar
                    </Button>
                  </form>
                </div>
              </>
            )}

            {/* Info for non-owners */}
            {!isOwner && (
              <div className="flex items-center gap-2 rounded-lg bg-slate-50 dark:bg-white/4 px-3 py-2.5">
                <ShieldCheck className="h-4 w-4 text-slate-400 shrink-0" />
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Apenas o OWNER pode adicionar ou remover membros.
                </p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Danger Zone Section ────────────────────────────────────────────────────────

function DangerZoneSection() {
  const resetMutation = useResetFinancialData();
  const [step1Open, setStep1Open] = useState(false);
  const [step2Open, setStep2Open] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  function handleStep1Confirm() {
    setStep1Open(false);
    setStep2Open(true);
    setConfirmText('');
  }

  async function handleFinalReset() {
    try {
      await resetMutation.mutateAsync();
      toast.success('Dados financeiros zerados com sucesso!');
      setStep2Open(false);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg || 'Erro ao zerar dados financeiros.');
    }
  }

  return (
    <>
      <Card className="border-rose-200 dark:border-rose-500/20">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-100 dark:bg-rose-500/15">
              <TriangleAlert className="h-4 w-4 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <CardTitle className="text-base text-rose-700 dark:text-rose-400">Zona de Perigo</CardTitle>
              <CardDescription>Ações irreversíveis. Use com muito cuidado.</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4 rounded-lg border border-rose-100 dark:border-rose-500/10 bg-rose-50/50 dark:bg-rose-500/5 p-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-800 dark:text-slate-100">
                Zerar todas as movimentações
              </p>
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                Remove todas as transações, faturas, lançamentos de cofrinhos e investimentos,
                zerando saldos de contas. Contas, cartões, cofrinhos e investimentos cadastrados são mantidos.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="shrink-0 border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 dark:border-rose-500/30 dark:text-rose-400 dark:hover:bg-rose-500/10"
              onClick={() => setStep1Open(true)}
            >
              Zerar dados
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Passo 1: aviso inicial */}
      <ConfirmDialog
        open={step1Open}
        onOpenChange={setStep1Open}
        title="Zerar todas as movimentações?"
        description={
          <span>
            Esta ação irá apagar <strong>todas as transações, faturas e lançamentos</strong> e zerar
            os saldos de contas, cofrinhos e investimentos.
            <br /><br />
            Os cadastros de contas, cartões, cofrinhos e investimentos serão mantidos.
            Você precisará confirmar novamente na próxima etapa.
          </span>
        }
        confirmLabel="Continuar"
        variant="danger"
        onConfirm={handleStep1Confirm}
      />

      {/* Passo 2: confirmação digitando ZERAR */}
      <Dialog
        open={step2Open}
        onOpenChange={(o) => { if (!resetMutation.isPending) setStep2Open(o); }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
              <TriangleAlert className="h-4 w-4" />
              Confirmação final
            </DialogTitle>
            <DialogDescription>
              Esta ação é <strong>irreversível</strong>. Digite{' '}
              <code className="rounded bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 font-mono text-xs text-rose-600 dark:text-rose-400">
                ZERAR
              </code>{' '}
              para confirmar que deseja apagar todos os dados financeiros.
            </DialogDescription>
          </DialogHeader>

          <Input
            placeholder="Digite ZERAR"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="font-mono"
            disabled={resetMutation.isPending}
          />

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setStep2Open(false)}
              disabled={resetMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              className="bg-rose-500 hover:bg-rose-600 text-white"
              disabled={confirmText !== 'ZERAR' || resetMutation.isPending}
              onClick={handleFinalReset}
            >
              {resetMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Zerar agora
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
