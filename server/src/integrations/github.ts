import jwt from 'jsonwebtoken';
import { Octokit } from '@octokit/rest';
import dotenv from 'dotenv';

dotenv.config();

export const generateGitHubAppJWT = (): string => {
    const privateKey = process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, '\n');

    const payload = {
        iat: Math.floor(Date.now() / 1000) - 60,
        exp: Math.floor(Date.now() / 1000) + (10 * 60), 
        iss: process.env.GITHUB_APP_ID!, 
    };

    return jwt.sign(payload, privateKey, { algorithm: 'RS256' });
};

export const getInstallationDetails = async (installationId: string) => {
    const token = generateGitHubAppJWT();

    const octokit = new Octokit({
        auth: token,
        userAgent: 'Taskan/1.0',
    });

    try {
        const { data } = await octokit.rest.apps.getInstallation({
            installation_id: parseInt(installationId),
        });
        return data;
    } catch (error: any) {
        console.error('GitHub API error:', error.response?.data || error.message);
        throw new Error(`Failed to get installation details: ${error.message}`);
    }
};

export const getInstallationAccessToken = async (installationId: string) => {
    const token = generateGitHubAppJWT();

    const octokit = new Octokit({
        auth: token,
        userAgent: 'Taskan/1.0',
    });

    try {
        const { data } = await octokit.rest.apps.createInstallationAccessToken({
            installation_id: parseInt(installationId),
        });
        return data.token;
    } catch (error: any) {
        console.error('GitHub API error:', error.response?.data || error.message);
        throw new Error(`Failed to create installation access token: ${error.message}`);
    }
};
