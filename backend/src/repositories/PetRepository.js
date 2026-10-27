import BaseRepository from './BaseRepository.js';

export default class PetRepository extends BaseRepository {
  constructor() {
    super('pet', 'id_pet');
  }

  async findByCustomer(idUser) {
    const { rows } = await this.db.query(
      'SELECT * FROM pet WHERE id_user = $1 ORDER BY id_pet', [idUser]
    );
    return rows;
  }
}
