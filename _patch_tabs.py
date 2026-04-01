filepath = r'C:\Users\lanie\OneDrive\.limpc\Bureau\inkdlow\pages\public\ClientDashboard.tsx'

with open(filepath, 'r', encoding='utf-8') as f:
    content = f.read()

start_marker = '            {/* ════ RÉSERVATIONS — placeholder start ════ */}'
end_marker = '            )}\n          </motion.div>'

start_idx = content.find(start_marker)
end_idx = content.find(end_marker)

assert start_idx != -1, 'start_marker not found'
assert end_idx != -1, 'end_marker not found'

new_chunk = r"""            {/* ════ RÉSERVATIONS ════ */}
            {tab === 'reservations' && (
              <div className="px-5 pt-5 pb-6">
                {isGuest ? (
                  <GuestConnectPanel
                    title="Mes Réservations"
                    body="Connecte-toi pour voir tes rendez-vous passés et à venir."
                  />
                ) : (
                  <>
                    <h2 className="text-2xl font-black mb-4" style={{ color: N.text }}>
                      Mes Réservations
                    </h2>

                    {appointments.length === 0 ? (
                      <div
                        className="rounded-3xl border px-4 py-10 text-center"
                        style={{ borderColor: N.border, background: N.surface }}
                      >
                        <CalendarDays className="w-8 h-8 mx-auto mb-3" style={{ color: N.muted }} />
                        <p className="font-bold mb-1" style={{ color: N.text }}>Pas encore de RDV</p>
                        <p className="text-sm" style={{ color: N.muted }}>
                          Tes réservations apparaîtront ici.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {appointments.map((a, i) => {
                          const { title, subtitle } = parseAppointmentService(a.service);
                          const statusLabel = RDV_STATUS_LABEL[a.status] ?? a.status;
                          const statusColor =
                            a.status === 'completed'
                              ? N.success
                              : a.status === 'cancelled'
                              ? N.error
                              : N.neon;
                          return (
                            <motion.div
                              key={a.id}
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className="rounded-3xl border overflow-hidden flex cursor-pointer active:scale-[0.99] transition-transform"
                              style={{ borderColor: N.border, background: N.surface }}
                              onClick={() => setRdvDetailTarget(a)}
                            >
                              {/* Bande couleur statut */}
                              <div className="w-1.5 shrink-0" style={{ background: statusColor }} />
                              <div className="flex-1 px-4 py-3.5 min-w-0">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0 flex-1">
                                    <p className="font-bold truncate" style={{ color: N.text }}>{title}</p>
                                    {subtitle && (
                                      <p className="text-xs mt-0.5 truncate" style={{ color: N.muted }}>{subtitle}</p>
                                    )}
                                    <p className="text-sm mt-1" style={{ color: N.textSub }}>
                                      {formatRdvDateTimeHeader(a.date, a.time)}
                                    </p>
                                    {a.studio_name && (
                                      <p className="text-xs mt-0.5" style={{ color: N.muted }}>{a.studio_name}</p>
                                    )}
                                  </div>
                                  <div className="shrink-0 flex flex-col items-end gap-1.5 pt-0.5">
                                    {a.price > 0 && (
                                      <span
                                        className="text-sm font-black tabular-nums"
                                        style={{ color: N.neonText }}
                                      >
                                        {a.price}€
                                      </span>
                                    )}
                                    <span
                                      className="text-[10px] font-semibold px-2 py-0.5 rounded-full whitespace-nowrap"
                                      style={{
                                        background: `${statusColor}1A`,
                                        color: statusColor,
                                      }}
                                    >
                                      {statusLabel}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ════ PROFIL / FIDÉLITÉ ════ */}
            {tab === 'profil' && (
              <div className="px-5 pt-5 space-y-5 pb-6">
                {isGuest ? (
                  <GuestLoginForm />
                ) : (
                  <>
                    {/* Header profil */}
                    <div className="flex items-center gap-4">
                      <div
                        className="relative w-16 h-16 rounded-full flex items-center justify-center font-bold text-xl overflow-hidden shrink-0 border-2"
                        style={{
                          background: profileAvatarUrl && !profileAvatarLoadFailed ? N.surface : N.neon,
                          color: '#fff',
                          borderColor: N.border,
                        }}
                      >
                        {profileAvatarUrl && !profileAvatarLoadFailed ? (
                          <img
                            src={profileAvatarUrl}
                            alt=""
                            className="w-full h-full object-cover"
                            onError={() => setProfileAvatarLoadFailed(true)}
                          />
                        ) : (
                          firstName.slice(0, 1).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xl font-black truncate" style={{ color: N.text }}>
                          {displayName || firstName}
                        </p>
                        <p className="text-sm truncate" style={{ color: N.muted }}>{sessionEmail}</p>
                        <span
                          className="inline-block mt-1 text-[10px] font-bold px-2.5 py-0.5 rounded-full"
                          style={{ background: N.neonDim, color: N.neonText }}
                        >
                          {completed.length >= 10
                            ? 'Client Platinum 🏆'
                            : completed.length >= 5
                            ? 'Client Or ⭐'
                            : completed.length >= 2
                            ? 'Client Silver 🥈'
                            : 'Client Bronze'}
                        </span>
                      </div>
                    </div>

                    {/* Carte fidélité */}
                    <LoyaltyCard
                      firstName={firstName}
                      code={code || 'XXXXXX'}
                      cents={cents}
                      stampsCount={completed.length}
                      lastStudio={completed[0]?.studio_name ?? undefined}
                      accessToken={accessToken}
                    />

                    {/* Historique visites */}
                    {completed.length > 0 && (
                      <section>
                        <h3
                          className="text-[11px] font-bold uppercase tracking-widest mb-3"
                          style={{ color: N.muted }}
                        >
                          Historique
                        </h3>
                        <div className="space-y-2.5">
                          {completed.slice(0, 5).map((a, i) => {
                            const { title } = parseAppointmentService(a.service);
                            return (
                              <motion.div
                                key={a.id}
                                initial={{ opacity: 0, x: -8 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.04 }}
                                className="flex items-center gap-3 rounded-2xl border px-4 py-3"
                                style={{ borderColor: N.border, background: N.surface }}
                              >
                                <div
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ background: N.success }}
                                />
                                <div className="flex-1 min-w-0">
                                  <p
                                    className="text-sm font-semibold truncate"
                                    style={{ color: N.text }}
                                  >
                                    {title}
                                  </p>
                                  <p className="text-xs mt-0.5" style={{ color: N.muted }}>
                                    {formatDateFr(a.date)}
                                    {a.studio_name ? ` · ${a.studio_name}` : ''}
                                  </p>
                                </div>
                                {a.price > 0 && (
                                  <span
                                    className="text-sm font-black tabular-nums shrink-0"
                                    style={{ color: N.neonText }}
                                  >
                                    {a.price}€
                                  </span>
                                )}
                              </motion.div>
                            );
                          })}
                        </div>
                      </section>
                    )}

                    {/* Parrainage */}
                    <div
                      className="rounded-3xl border overflow-hidden"
                      style={{ borderColor: N.borderMid, background: N.surface }}
                    >
                      <div
                        className="px-5 pt-5 pb-4"
                        style={{
                          background:
                            'linear-gradient(135deg, rgba(212,188,150,0.08), rgba(212,188,150,0.02))',
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <p
                              className="text-[11px] font-bold uppercase tracking-widest mb-1"
                              style={{ color: N.neon }}
                            >
                              Parrainage
                            </p>
                            <h3 className="text-lg font-black" style={{ color: N.text }}>
                              Gagne 10€ par ami
                            </h3>
                            <p className="text-xs mt-1" style={{ color: N.muted }}>
                              Pour chaque ami qui réserve son 1er tattoo via ton lien.
                            </p>
                          </div>
                          {referralCount > 0 && (
                            <div
                              className="flex flex-col items-center px-3 py-2 rounded-2xl border ml-3 shrink-0"
                              style={{ borderColor: N.border, background: N.elevated }}
                            >
                              <span
                                className="text-xl font-black tabular-nums"
                                style={{ color: N.neonText }}
                              >
                                {referralCount}
                              </span>
                              <span
                                className="text-[9px] uppercase tracking-wider mt-0.5"
                                style={{ color: N.muted }}
                              >
                                amis
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="px-5 pb-5 pt-3 space-y-3">
                        <div
                          className="flex items-center gap-2 px-3.5 py-3 rounded-2xl border"
                          style={{ borderColor: N.border, background: N.elevated }}
                        >
                          <span
                            className="flex-1 text-xs font-mono truncate"
                            style={{ color: N.textSub }}
                          >
                            {shareUrl.replace(/^https?:\/\//, '')}
                          </span>
                          <motion.button
                            type="button"
                            whileTap={{ scale: 0.9 }}
                            onClick={copyCode}
                            className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                            style={{
                              background: copiedCode
                                ? 'rgba(94,219,154,0.15)'
                                : N.neonDim,
                              color: copiedCode ? N.success : N.neon,
                            }}
                          >
                            <AnimatePresence mode="wait" initial={false}>
                              {copiedCode ? (
                                <motion.span
                                  key="c"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  <Check className="w-4 h-4" />
                                </motion.span>
                              ) : (
                                <motion.span
                                  key="p"
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  exit={{ scale: 0 }}
                                >
                                  <Copy className="w-4 h-4" />
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </motion.button>
                        </div>
                        <motion.button
                          type="button"
                          whileTap={{ scale: 0.98 }}
                          onClick={() =>
                            navigator.share?.({ title: 'Inkflow', url: shareUrl }).catch(() => {})
                          }
                          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-sm"
                          style={{ background: N.neon, color: N.bg, boxShadow: N.neonGlow }}
                        >
                          <Share2 className="w-4 h-4" />
                          Partager mon invitation
                        </motion.button>
                      </div>
                    </div>

                    {/* Déconnexion */}
                    <button
                      type="button"
                      onClick={() => supabase.auth.signOut()}
                      className="w-full py-3.5 rounded-2xl border font-semibold text-sm flex items-center justify-center gap-2"
                      style={{ borderColor: N.border, color: N.muted, background: 'transparent' }}
                    >
                      <LogOut className="w-4 h-4" />
                      Se déconnecter
                    </button>
                  </>
                )}
              </div>
            )}"""

new_content = content[:start_idx] + new_chunk + content[end_idx + len('            )}'):]

with open(filepath, 'w', encoding='utf-8') as f:
    f.write(new_content)

print('Done.')
print(f'New file length: {len(new_content)}')
