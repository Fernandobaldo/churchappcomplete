import { ContributionService } from '../services/contributionService';
import { createContributionBodySchema } from '../schemas/contributionSchemas';
export class ContributionController {
    constructor() {
        this.service = new ContributionService();
    }
    async getAll(request, reply) {
        const user = request.user;
        if (!user?.branchId) {
            return reply.status(400).send({ message: 'Usuário não vinculado a uma filial.' });
        }
        const contributions = await this.service.getByBranch(user.branchId);
        return reply.send(contributions);
    }
    async create(request, reply) {
        const data = createContributionBodySchema.parse(request.body);
        const user = request.user;
        const created = await this.service.create({
            ...data,
            branchId: user.branchId
        });
        return reply.code(201).send(created);
    }
    async getTypes(_, reply) {
        return reply.send([
            { label: 'Dízimo', value: 'DIZIMO' },
            { label: 'Oferta', value: 'OFERTA' },
            { label: 'Outro', value: 'OUTRO' },
        ]);
    }
}
