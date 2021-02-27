import { Request, Response } from "express";
import { getCustomRepository } from "typeorm";
import { SurveysRepository } from "../repositories/SurveysRepository";
import { SurveysUsersRepository } from "../repositories/SurveysUsersRepository";
import { UsersRepository } from "../repositories/UsersRepository";
import SendMailService from "../services/SendMailService";
import { resolve } from "path";
import { AppError } from "../errors/AppError";

class SendMailController {
    async execute(request: Request, response: Response) {
        const { email, survey_id } = request.body;

        const usersRepository = getCustomRepository(UsersRepository);
        const surveysRepository = getCustomRepository(SurveysRepository);
        const surveysUsersRepository = getCustomRepository(SurveysUsersRepository);

        const user = await usersRepository.findOne({ email });

        if (!user) {
            throw new AppError("User does not exists!");
        }

        const survey = await surveysRepository.findOne({ id: survey_id });

        if (!survey) {
            throw new AppError("Survey does not exists!")
        };

        const surveyUserAlreadyExists = await surveysUsersRepository.findOne({
            where: { user_id: user.id, value: null }, // formatamos o SELECT para a utilização do AND, e não do OR, como estava no código antigo.
            relations: ["user", "survey"],
        });

        const npsPath = resolve(__dirname, "..", "views", "emails", "npsMail.hbs");

        const variables = {
            name: user.name,
            title: survey.title,
            description: survey.description,
            link: process.env.URL_MAIL,
            id: "",
        };

        if (surveyUserAlreadyExists) {
            variables.id = surveyUserAlreadyExists.id;
            await SendMailService.execute(email, survey.title, variables, npsPath);
            return response.json(surveyUserAlreadyExists);
        }

        // Agora, faremos o processamento das informações em duas etapas:
        // Salvar as informações na tabela Surveys Users;
        const surveyUser = surveysUsersRepository.create({
            user_id: user.id,
            survey_id,
        });

        await surveysUsersRepository.save(surveyUser);
        variables.id = surveyUser.id;

        // Enviar e-mail para o usuário.
        await SendMailService.execute(email, survey.title, variables, npsPath);

        return response.status(201).json(surveyUser);
    }
}

export { SendMailController };
