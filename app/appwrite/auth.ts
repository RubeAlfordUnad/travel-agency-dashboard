import { account, appwriteConfig, database } from "~/appwrite/client"
import { ID, OAuthProvider, Query } from "appwrite"
import { redirect } from "react-router"

export const loginWithGoogle = async () => {
    try { 
        account.createOAuth2Session(OAuthProvider.Google)
    } catch (e) {
        console.error('loginWithGoogle', e)
    }
}
export const logoutUser = async () => {
    try { 
        await account.deleteSession('current')
        return true;
    } catch (e) {
        console.log('logoutUser error:' ,e)
        return false;
    }
}
export const getUser = async () => {
    try { 
        const user = await account.get();

        if (!user) return redirect('/sign-in')

            const { documents } = await database.listDocuments(
                appwriteConfig.databaseId,
                appwriteConfig.userCollectionId,
                [
                    Query.equal('accountId', user.$id),
                    Query.select(['name', 'email', 'joinedAt', 'accountId']),
                ]
            )
    } catch (e) {
        console.error(e)
    }
}
export const getGooglePicture = async () => {
    try { 
        // Get the current user session
        const session = await account.getSession('current')
        // Get the OAuth2 token from the session
        const oAuthToken = session.providerAccessToken;

        if (!oAuthToken) {
            console.log('No OAuth2 token found')
            return null
        }

        // Make a request to the Google API to get the profile photo
        const response = await fetch('https://www.googleapis.com/v1/people/me?personFields=photos', {
            headers: {
                Authorization: `Bearer ${oAuthToken}`,
                }
            }
        );

        const data = await response.json();

        //Extract the profile photo URL from the response
        const photoUrl = data.photos && data.photos.length > 0 ? data.photos[0].url : null;
    } catch (e) {
        console.log('getGooglePicture error:',e);
        return null;
    }
}
export const storeUserData = async () => {
    try { 
        const user = await account.get();

        if (!user) return null;

        // Check if the user already exists in the database
        const { documents } = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
        );
        if (documents.length > 0) return documents[0];

        // Get the user's Google profile picture
        const imageUrl = await getGooglePicture();

        // Create a new user document
        const newUser = await database.createDocument(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            ID.unique(),
            {
                accountId: user.$id,
                email: user.email,
                name: user.name,
                imageUrl: imageUrl || '',
                joinedAt: new Date().toISOString(),
            }
        );
        return newUser;
    } catch (e) {
        console.log('storeUserData error:', e);
        return null;
    }
}
export const getExistingUser = async () => {
    try { 
        const user = await account.get();

        if (!user) return null;

        // Check if the user already exists in the database
        const { documents } = await database.listDocuments(
            appwriteConfig.databaseId,
            appwriteConfig.userCollectionId,
            [
                Query.equal('accountId', user.$id),
            ]
        );

        if (documents.length === 0) return null;

        return documents[0];
    } catch (e) {
        console.log('getExistingUser error:' ,e)
        return null;
    }
}

