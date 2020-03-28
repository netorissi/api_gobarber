import * as yup from 'yup';

import User from '../models/User';

class UserController {
  async store(req, res) {
    const schema = yup.object().shape({
      name: yup.string().required(),
      email: yup.string().email().required(),
      password: yup.string().required().min(6),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed.' });
    }

    const userExists = await User.findOne({ where: { email: req.body.email } });

    if (userExists)
      return res.status(400).json({ error: 'User already exists.' });

    const { id, name, email, provider } = await User.create(req.body);
    return res.json({ id, name, email, provider });
  }

  async update(req, res) {
    const schema = yup.object().shape({
      name: yup.string(),
      email: yup.string().email(),
      old_password: yup.string().min(6),
      password: yup
        .string()
        .min(6)
        .when('old_password', (old_password, field) =>
          old_password ? field.required() : field
        ),
      confirm_password: yup
        .string()
        .when('password', (password, field) =>
          password ? field.required().oneOf([yup.ref('password')]) : field
        ),
    });

    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: 'Validation failed.' });
    }
    const { email, old_password } = req.body;

    const user = await User.findByPk(req.user_id);

    if (email && email !== user.email) {
      const userExists = await User.findOne({ where: { email } });

      if (userExists)
        return res.status(400).json({ error: 'User already exists.' });
    }

    if (old_password && !(await user.checkPassword(old_password)))
      return res.status(401).json({ error: 'Password does not match.' });

    const { id, name, provider } = await user.update(req.body);

    return res.json({ id, name, email, provider });
  }
}

export default new UserController();
