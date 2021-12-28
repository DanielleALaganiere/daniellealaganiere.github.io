#CSE30, Assignment 5
#Framework created 6/16/20
#Updated 6/18/21

#Used replit instead.
#Find code at https://replit.com/@DanielleLaganie/Pantry

from collections import defaultdict

#Helper Functions
def used_ingredients(recipes):
        total = AD({})
        for recipe in recipes:
            for item in list(recipe.ingredients.keys()):
                if item in list(total.keys()):
                    total[item] += recipe.ingredients[item]
                else:
                    total.update({item:recipe.ingredients[item]})

        return(total)

#Arithmetic Dictionary Class
class AD(dict):
    def __init__(self, *args, **kwargs):
        """This initializer simply passes all arguments to dict, so that
        we can create an AD with the same ease with which we can create 
        a dict.  There is no need, indeed, to repeat the initializer, 
        but we leave it here in case we want to create attributes specific
        to an AD later."""
        super().__init__(*args, **kwargs)

    def __add__(self, other):
        return AD._binary_op(self, other, lambda x, y: x + y, 0)

    def __sub__(self, other):
        return AD._binary_op(self, other, lambda x, y: x - y, 0)
    
    @staticmethod
    def _binary_op(left, right, op, neutral):
        r = AD()
        l_keys = set(left.keys()) if isinstance(left, dict) else set()
        r_keys = set(right.keys()) if isinstance(right, dict) else set()
        for k in l_keys | r_keys:
            # If the right (or left) element is a dictionary (or an AD), 
            # we get the elements from the dictionary; else we use the right 
            # or left value itself.  This implements a sort of dictionary
            # broadcasting.
            l_val = left.get(k, neutral) if isinstance(left, dict) else left
            r_val = right.get(k, neutral) if isinstance(right, dict) else right
            r[k] = op(l_val, r_val)
        return r

    
#Pantry Class: subclass of AD which holds cooking ingredients.
class Pantry(AD):
    def __init__(self, ingredients):
        """We initialize the Pantry class by passing the
        ingredients that were passed in to the initializer
        for the superclass, AD"""
        super().__init__(ingredients)
    def needed_ingredients(self, recipes):
        """Given a list of recipes, computes which ingredients 
        to buy, and in which quantity, to be able to make all recipes."""
        given = self + AD({})
        needed = AD({})
        final = AD({})

        for recipe in recipes:
            keys = list(recipe.ingredients.keys())
            values = list(recipe.ingredients.values())
            for j in keys:
                #for individual ingredients in recipes:
                if j in list(needed.keys()):
                #If already on needed list, increase value
                    needed[j] = needed[j] + recipe.ingredients[j]
                else:
                #If not already on needed list, add it to the list
                    needed.update({j:recipe.ingredients[j]})

        for item in needed.keys():
            if item in given.keys():
                #if item in given and in needed, see the difference 
                difference = needed[item] - given[item]
                if (difference >0):
                #if you dont have enough, update list with difference
                    final.update({item:difference})
            else:
                #if you arent given any, add to list
                final.update({item:needed[item]})

        pantry_final = Pantry(final)
        return pantry_final

    def individually_feasible(self, recipes):
        """Returns a list of recipes that could be
        individually made using the ingredients in the pantry."""
        given = self + AD({})
        possible = []

        for recipe in recipes:
            counter = 0
            for item in list(recipe.ingredients.keys()):
                if (item in self.keys()) and (self[item] - recipe.ingredients[item] >= 0):
                    #If the ingredient is in the given pantry and you have enough, increase counter
                    counter += 1

            if counter == len(list(recipe.ingredients.keys())):
                #If you have enough of all the ingredients, add recipe to the final list
                possible.append(recipe)
            
            return possible

    def simul_feasible_nr(self, recipes):
        """Returns a list containing different combinations of recipes that could be made 
        simultaneously using the ingredients available in the pantry. 
        Neither the order of the outer list nor the order of the inner list matters.
        'nr' in the name mean non-repeating"""  
        given = self + AD({})
        recipies = recipes[:]
        final_list = [[]]        #Remember: first item is empty list, dont return it!
        for recipe in recipies:
            temp_list = []  #reset temp list
            for item_list in final_list:
                temp_pantry = given - used_ingredients(item_list)
                pantry = Pantry(temp_pantry)
                x = pantry.individually_feasible([recipe])
                if x == [recipe]:
                    item_copy = item_list[:]
                    item_copy.append(recipe)
                    temp_list.append(item_copy)
            final_list.extend(temp_list)
        return(final_list[1:])



#Recipe Class: specifies the ingredients that are required to make a dish.
class Recipe:
    def __init__(self, name, ingredients):
        """We initialize the Recipe class, which stores the 
        name of a recipe as well as the needed ingredients
        in the form of an AD"""
        self.name = name
        self.ingredients = AD(ingredients) 

    def __repr__(self):
        """To have a better representation of the recipe"""
        return f'{self.name}: {self.ingredients}'

    def __hash__(self):
        """Allows us to use a Recipe object inside a set or as 
        a dictionary key. We assume that each recipe will have
        a unique name, and therefore we can simply use the built-in
        hash function on the name and return it as the hash id."""
        return hash(self.name)
    
    def __eq__(self,other):
        """For a recipe to equal another, their name and ingredients 
        must match"""
        return self.name == other.name and dict(self.ingredients) == dict(other.ingredients)


'''
    print("\nTesting Pantry.py")
    print("All following prints should be identical:\n")

    pantry1 = Pantry({})
    pantry2 = Pantry({"noodles":5, "soy sauce":8, "pepper":10, "bean sprouts":12, "egg":5, "lemon":6})
    pantry3 = Pantry({"chicken drumstick":5, "egg":10, "oil":6, "flour":8, "hot dog":3, "pepper":6})
    pantry4 = Pantry({"egg":6, "beans":11, "rice":7, "onion": 1,
                "mushrooms":1, "spinach":1, "cheese":1,
                "soy sauce":1, "butter":1, "oil":2})

    r1 = Recipe("r1", {"egg":2, "beans":5})
    r2 = Recipe("r2", {"egg":3, "rice":4})
    r3 = Recipe("r3", {"egg":4, "corn":1})
    r4 = Recipe("r4", {"beans":5})
    ramen = Recipe("Ramen", {"noodles":1, "soy sauce":2, "egg": 2, "bean sprouts":4})
    fried_chicken = Recipe("Fried Chicken", {"chicken drumstick":1, "egg":2, "flour":1})
    butter_fries = Recipe("Butter Fries", {"potato":4, "butter":1, "oil":1})
    boiled_egg = Recipe("Boiled Egg", {"egg":1})
    fried_rice = Recipe("Fried Rice", {"rice":4, "egg":2, "onion":1, "soy sauce":1, "oil":1})
    rice_and_beans = Recipe("Rice and Beans", {"rice":4, "beans":4, "oil":1})
    spinach_mushroom_scrambled_eggs = Recipe("Spinach-Mushroom Scrambled Eggs", {"egg":4, "mushrooms":1, "spinach":0.2, "cheese":1, "butter":1})
    watermelon = Recipe("Watermelon", {"watermelon":1})


    #Testing the needed_ingredients
    needed1 = pantry1.needed_ingredients([r1, r2, r3, r4])
    print(needed1)
    print({"egg": 9, "beans": 10, "rice": 4, "corn": 1})
    print()

    needed2 = pantry1.needed_ingredients([r4, r4, r4, r4])
    print(needed2)
    print({"beans": 20})
    print()

    # How many times can we make ramen/ what do we need more of?
    print(pantry2.needed_ingredients([ramen]))
    print(Pantry({}))
    print()

    print(pantry2.needed_ingredients([ramen, ramen]))
    print(Pantry({}))
    print()

    print((pantry2.needed_ingredients([ramen, ramen, ramen])))
    print({"egg": 1})
    print()

    print(pantry2.needed_ingredients([ramen, ramen, ramen, ramen]))
    print({"egg": 3, "bean sprouts": 4})
    print()

    #Testing individual_feasible
    recipes = [fried_chicken, butter_fries, boiled_egg]
    print("Order doesn't matter:")
    print(sorted(pantry3.individually_feasible(recipes), key=lambda x: x.name))
    print([boiled_egg, fried_chicken])
    print()

    #Testing simul_feasible_nr
    print("list of supplies that can be made simultaniously via increasing pantry:")
    p1_simul_feasible_nr = pantry4.simul_feasible_nr([fried_rice, rice_and_beans, spinach_mushroom_scrambled_eggs, watermelon])
    for collection in p1_simul_feasible_nr:
        print("Recipe(s) that can be made simultaneously:")
        for recipe in collection:
            print("  * {}".format(recipe.name))
        print("")
'''