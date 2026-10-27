import BaseRepository from './BaseRepository.js';

export default class UserRepository extends BaseRepository {
  constructor() {
    super('users', 'id_user');
  }
}
