const jwt      = require('jsonwebtoken');
const supabase = require('../config/supabase');

module.exports = async function auth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return res.status(401).json({ error: 'Token ausente' });

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Verifica se usuário ainda existe e está ativo
    const { data, error } = await supabase
      .from('cms_users')
      .select('id, email, name, role')
      .eq('id', payload.sub)
      .eq('is_active', true)
      .single();

    if (error || !data) return res.status(401).json({ error: 'Usuário inválido' });
    req.user = data;
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Token inválido ou expirado' });
  }
};
