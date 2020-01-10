var TK_TYPE_OPP = 1;
var TK_TYPE_NUM = 2;
var TK_TYPE_STR = 3;
var TK_TYPE_FOP = 4;
var TK_TYPE_FCL = 5;
var TK_TYPE_FSP = 6;
 
var NODE_TYPE_OPP = 1;
var NODE_TYPE_NUM = 2;
var NODE_TYPE_FUN = 3;
var NODE_TYPE_FSP = 4;
var NODE_TYPE_VAR = 5;
var NODE_TYPE_FCL = 6;
var NODE_TYPE_EXP = 7;
var NODE_TYPE_FFN = 8;
var NODE_TYPE_ZRO = 9;

var parse_funcs = [
"tan", "sin", "cos", "cot", "csc", "sec", 
"atan", "asin", "acos", "acot", "acsc", 
"asec", "max", "min", "ln", "log", "exp", 
"abs", "mod", "pow", "sqrt", "sign", "floor", 
"sigma", "PI", "integral", "gamma", "D"];

function gpInternal_eqConvert(text) {
	var result = new Object();

	var tempStr = "";
	var tempType = 0;
	var lastType = 0;

	var tokenStack = [];

	for (var i = 0; i < text.length; i++) {
		var c = text.charAt(i);
		if (c == ' ') {
			continue;
		}

		tempType = 0;
		if (c == '0' || c == '1' || c == '2' ||
			c == '3' || c == '4' || c == '5' ||
			c == '6' || c == '7' || c == '8' ||
			c == '9' || c == '.') {
			tempType = TK_TYPE_NUM;
		}

		if (c == '+' || c == '-' || c == '*' ||
			c == '/' || c == '^' || c == '=') {
			tempType = TK_TYPE_OPP;
		}

		if (c == '(') {
			tempType = TK_TYPE_FOP;
		}

		if (c == ')') {
			tempType = TK_TYPE_FCL;
		}

		if (c == ',') {
			tempType = TK_TYPE_FSP;
		}

		if (tempType == 0) {
			tempType = TK_TYPE_STR;
		}

		if (lastType == 0) {
			tempStr = tempStr + c;
			lastType = tempType;
		}
		else if (lastType == tempType) {
			tempStr = tempStr + c;
		}
		else {
			var tempT = new Object();
			tempT.type = lastType;
			tempT.value = tempStr;

			tokenStack.push(tempT);
			
			lastType = tempType;

			tempStr = c;
		}
	}

	var tempT = new Object();
	tempT.type = lastType;
	tempT.value = tempStr;
	tokenStack.push(tempT);

	var stack = [];

	for (var i = 0; i < tokenStack.length;i++) {
		var t = tokenStack[i];

		if ((t.type == TK_TYPE_OPP || t.type == TK_TYPE_FOP || t.type == TK_TYPE_FCL || t.type == TK_TYPE_FSP) && t.value.length > 1) {
			for (var j = 0; j < t.value.length; j++) {
				var temp = new Object();
				temp.type = t.type;
				temp.value = t.value.charAt(0);

				stack.push(temp);
			}
		}
		else {
			stack.push(t);
		}
	}

	var unsortedNodes = [];
	for (var i = 0; i < stack.length; i++) {
		var t = stack[i];

		if (t.type == TK_TYPE_NUM) {
			var tempNode = new Object();
			tempNode.type = NODE_TYPE_NUM;
			tempNode.value = t.value;
			unsortedNodes.push(tempNode);
		}
		else if (t.type == TK_TYPE_OPP) {
			var tempNode = new Object();
			tempNode.type = NODE_TYPE_OPP;
			tempNode.value = t.value;
			unsortedNodes.push(tempNode);
		}
		else if (t.type == TK_TYPE_FSP) {
			var tempNode = new Object();
			tempNode.type = NODE_TYPE_FSP;
			unsortedNodes.push(tempNode);
		}
		else if (t.type == TK_TYPE_FCL) {
			var tempNode = new Object();
			tempNode.type = NODE_TYPE_FCL;
			unsortedNodes.push(tempNode);
		}
		else if (t.type == TK_TYPE_FOP) {
			if (i == 0 || stack[i - 1].type != TK_TYPE_STR) {
				var tempNode = new Object();
				tempNode.type = NODE_TYPE_FUN;
				tempNode.value = null;

				unsortedNodes.push(tempNode);
			}
		}
		else {
			if (i == stack.length - 1) {
				var tempNode = new Object();
				tempNode.type = NODE_TYPE_VAR;
				tempNode.value = t.value;
				unsortedNodes.push(tempNode);
				continue;
			}

			var next = stack[i + 1];

			if (next.type == TK_TYPE_FOP) {
				var tempNode = new Object();
				tempNode.type = NODE_TYPE_FUN;
				tempNode.value = t.value;

				var found = false;
				for (var j = 0; j < parse_funcs.length;j++) {
					if (parse_funcs[j] == t.value) {
						found = true;
						break;
					}
				}

				if (found == false) {
					result.error = "Unknow Function: " + t.value;
					return result;
				}

				unsortedNodes.push(tempNode);
			}
			else {
				var tempNode = new Object();
				tempNode.type = NODE_TYPE_VAR;
				tempNode.value = t.value;
				unsortedNodes.push(tempNode);
			}
		}
	}

	var parseResult = parseExpression(unsortedNodes);

	if (parseResult.error) {
		if (parseResult.error != "") {
			result.error = parseResult.error;
			return result;
		}
		else {
			result.error = "Unkown error";
			return result;
		}
	}

	var currentVars = ["pi", "tau", "e", "t", "x", "y"];

	var funcID = new Object();
	funcID.ID = 1;
	var resultString = getNodeString(parseResult[0], funcID, currentVars);

	if(resultString.error) {
		result.error = resultString.error;
		return result;
	}

	result.body = resultString.body;
	result.funcs = resultString.funcs;

	console.log(result.body);

	return result;
}

function parseExpression(nodes) {
	var simple = [];
	var funcTemp = [];

	var curFunc = null;
	var level = 0;

	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];

		if (level == 0) {
			if (node.type == NODE_TYPE_FUN) {
				curFunc = node.value;
				level++;
			} else {
				simple.push(node);
			}
		} else {
			if (node.type == NODE_TYPE_FUN) {
				level++;
			} else if (node.type == NODE_TYPE_FCL) {
				level--;
			}
			if (level != 0) {
				funcTemp.push(node);
			} else {
				var funcNodeArr = parseExpression(funcTemp);

				if (funcNodeArr.error) {
					return funcNodeArr;
				}

				var funcNode = new Object();
				funcNode.type = NODE_TYPE_FFN;
				funcNode.value = curFunc;
				funcNode.children = [];
				
				for (var j = 0; j < funcNodeArr.length; j++) {
					funcNode.children.push(funcNodeArr[j]);
				}

				simple.push(funcNode);

				funcTemp = [];
			}
		}
	}

	var result = [];

	if (level != 0) {
		result.error = "Parentheses error";
		return result;
	}

	var parts = [[]];
	var part = 0;
	
	for (var i = 0; i < simple.length; i++) {
		var node = simple[i];

		if(node.type == NODE_TYPE_FSP) {
			part++;
			parts.push([]);
		} else {
			parts[part].push(node);
		}
	}
	
	for (var i = 0; i < parts.length; i++) {
		var simplePart = parseSimpleExpression(parts[i]);

		if (simplePart.error) {
			result.error = simplePart.error;
			return result;
		}

		result.push(simplePart);
	}

	return result;
}

function parseSimpleExpression(nodes) {
	if (nodes.length == 0) {
		var result = [];
		result.error = "_";
		return result;
	}

	if (nodes.length == 1) {
		return nodes[0];
	}

	var level = -1;
	for (var i = 0; i < nodes.length; i++) {
		if (nodes[i].type == NODE_TYPE_OPP) {
			var opLevel = getOpporatorOrder(nodes[i].value);
			if (opLevel > level) {
				level = opLevel;
			}
		}
	}

	var tempVec = [];
	for (var i = 0; i < nodes.length; i++) {
		var node = nodes[i];

		if (node.type != NODE_TYPE_OPP) {
			tempVec.push(node);
		}
		else if (node.type == NODE_TYPE_OPP) {
			if (getOpporatorOrder(node.value) != level) {
				tempVec.push(node);
			}
			else {
				var prev = parseSimpleExpression(tempVec);

				if (prev.error) {
					if (node.value == '-') {
						prev = new Object();
						prev.type = NODE_TYPE_ZRO;
					}
					else {
						if (prev.error != "_") {
							return prev;
						}

						var result = [];
						result.error = "Left side of operator '" + node.value + "' is blank";
						return result;
					}
				}

				var temp2 = [];
				var loc = -1;

				for (var j = i + 1; j < nodes.length; j++) {
					var node2 = nodes[j];
					if (node2.type == NODE_TYPE_OPP) {
						if (getOpporatorOrder(node2.value) == level) {
							loc = j;
							break;
						}
						else {
							temp2.push(node2);
						}
					}
					else {
						temp2.push(node2);
					}
				}

				var next = parseSimpleExpression(temp2);

				if (next.error) {
					if (next.error != "_") {
						return next;
					}

					var result = [];
					result.error = "Right side of operator '" + node.value + "' is blank";
					return result;
				}

				node.children = [];
				node.children[0] = prev;
				node.children[1] = next;

				if (loc != -1) {
					i = loc - 1;
					tempVec = [];

					tempVec.push(node);
				}
				else {
					return node;
				}
			}
		}
	}

	var result = [];
	result.error = "Missing opperator";
	return result;
}

function getOpporatorOrder(op) {
	if (op == '^') {
		return 1;
	}

	if (op == '*' || op == '/') {
		return 2;
	}

	if (op == '+' || op == '-') {
		return 3;
	}

	if (op == '=') {
		return 4;
	}

	return -1;
}

function getNodeString(node, funcID, currentVars) {
	var result = new Object();
	result.body = "";
	result.funcs = "";

	if (node.type == NODE_TYPE_ZRO) {
		result.body = "0.0";
	}
	else if (node.type == NODE_TYPE_NUM) {
		result.body = node.value;
		if(!result.body.includes(".")) {
			result.body+=".0";
		}
	}
	else if (node.type == NODE_TYPE_VAR) {
		result.body = node.value;

		for(var i = 0; i < currentVars.length; i++) {
			if(currentVars[i] == node.value) {
				return result;
			}
		}

		result.error = "Unkown Variable: " + node.value;
	}
	else if (node.type == NODE_TYPE_OPP) {
		var prev = node.children[0];
		var post = node.children[1];

		if (node.value[0] == '+') {
			var prevString = getNodeString(prev, funcID, currentVars);
			if(prevString.error) {
				result.error = prevString.error;
				return result;
			}

			var postString = getNodeString(post, funcID, currentVars);
			if(postString.error) {
				result.error = postString.error;
				return result;
			}

			result.body = "(" + prevString.body + ")+(" + postString.body + ")";
			result.funcs = prevString.funcs + postString.funcs;
		}
		else if (node.value[0] == '-') {
			var prevString = getNodeString(prev, funcID, currentVars);
			if(prevString.error) {
				result.error = prevString.error;
				return result;
			}

			var postString = getNodeString(post, funcID, currentVars);
			if(postString.error) {
				result.error = postString.error;
				return result;
			}

			result.body = "(" + prevString.body + ")-(" + postString.body + ")";
			result.funcs = prevString.funcs + postString.funcs;
		}
		else if (node.value[0] == '*') {
			var prevString = getNodeString(prev, funcID, currentVars);
			if(prevString.error) {
				result.error = prevString.error;
				return result;
			}

			var postString = getNodeString(post, funcID, currentVars);
			if(postString.error) {
				result.error = postString.error;
				return result;
			}

			result.body = "(" + prevString.body + ")*(" + postString.body + ")";
			result.funcs = prevString.funcs + postString.funcs;
		}
		else if (node.value[0] == '/') {
			var prevString = getNodeString(prev, funcID, currentVars);
			if(prevString.error) {
				result.error = prevString.error;
				return result;
			}

			var postString = getNodeString(post, funcID, currentVars);
			if(postString.error) {
				result.error = postString.error;
				return result;
			}

			result.body = "(" + prevString.body + ")/(" + postString.body + ")";
			result.funcs = prevString.funcs + postString.funcs;
		}
		else if (node.value[0] == '=') {
			var prevString = getNodeString(prev, funcID, currentVars);
			if(prevString.error) {
				result.error = prevString.error;
				return result;
			}

			var postString = getNodeString(post, funcID, currentVars);

			if(postString.error) {
				result.error = postString.error;
				return result;
			}

			result.body = "(" + prevString.body + ")-(" + postString.body + ")";
			result.funcs = prevString.funcs + postString.funcs;
		}
		else if (node.value[0] == '^') {
			var prevString = getNodeString(prev, funcID, currentVars);

			if(prevString.error) {
				result.error = prevString.error;
				return result;
			}

			var postString = getNodeString(post, funcID, currentVars);

			if(postString.error) {
				result.error = postString.error;
				return result;
			}

			result.body = "pow_c(" + prevString.body + "," + postString.body + ")";
			result.funcs = prevString.funcs + postString.funcs;
		}

	}
	else if (node.type == NODE_TYPE_FFN) {
		var name = node.value;
		var childString = "";

		if (name == null) {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = childString.body;
			result.funcs = childString.funcs;
		}
		else if (name == "sqrt") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "sqrt(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "ln") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "log(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "log") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "(log(" + childString.body + ")/log(10.0))";
			result.funcs = childString.funcs;
		}
		else if (name == "sin") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "sin_c(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "cos") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "cos_c(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "tan") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "tan_c(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "asin") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "asin_c(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "acos") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "acos_c(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "atan") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "atan(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "cot") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "(1.0/tan_c(" + childString.body + "))";
			result.funcs = childString.funcs;
		}
		else if (name == "csc") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "(1.0/sin_c(" + childString.body + "))";
			result.funcs = childString.funcs;
		}
		else if (name == "sec") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "(1.0/cos_c(" + childString.body + "))";
			result.funcs = childString.funcs;
		}
		else if (name == "acot") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "acot_c(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "acsc") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "asin_c(1.0/(" + childString.body + "))";
			result.funcs = childString.funcs;
		}
		else if (name == "asec") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "acos_c(1.0/(" + childString.body + "))";
			result.funcs = childString.funcs;
		}
		else if (name == "pow") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "pow_c(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "min") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			var secondString = getNodeString(node.children[1], funcID, currentVars);

			if(secondString.error) {
				result.error = secondString.error;
			}

			result.body = "min(" + childString.body + "," + secondString.body + ")";
			result.funcs = childString.funcs + secondString.funcs;
		}
		else if (name == "max") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			var secondString = getNodeString(node.children[1], funcID, currentVars);

			if(secondString.error) {
				result.error = secondString.error;
			}

			result.body = "max(" + childString.body + "," + secondString.body + ")";
			result.funcs = childString.funcs + secondString.funcs;
		}
		else if (name == "sigma") {
			var addFunctionName = "custom_math_func_" + funcID.ID;

			funcID.ID = funcID.ID + 1;

			var incName = "";

			if (node.children[0].type == NODE_TYPE_VAR) {
				incName = node.children[0].value;
			} else {
				result.error = "Increment argument of sigma function was not a variable!";
				return result;
			}

			var newCurrentVars = currentVars.slice(0);
			newCurrentVars.push(incName);

			var arg1 = getNodeString(node.children[1], funcID, newCurrentVars);
			if(arg1.error) {
				result.error = arg1.error;
				return result;
			}

			var arg2 = getNodeString(node.children[2], funcID, newCurrentVars);
			if(arg2.error) {
				result.error = arg2.error;
				return result;
			}

			var addVarArgs = "";
			var addVarCall = "";

			for (var i = 6; i < currentVars.length; i++) {
				var cVar = currentVars[i];

				addVarArgs += ", float ";
				addVarArgs +=  cVar.name;

				addVarCall += ", ";
				addVarCall += cVar.name;
			}

			var formula = getNodeString(node.children[3], funcID, newCurrentVars);
			if(formula.error) {
				result.error = formula.error;
				return result;
			}

			var addFunctionString = 
				"float "+ addFunctionName + "(float x, float y" + addVarArgs + `) {
					float result = 0.0;
					for(float ` + incName + " = " + arg1.body + "; "+ incName + " <= " + arg2.body + "; " + incName + `+=1.0) {
						result += ` + formula.body + `;
					}
					return result; 
				}`;

			result.funcs = arg1.funcs + arg2.funcs + formula.funcs + addFunctionString;
			result.body = addFunctionName + "(x, y" + addVarCall + ")";
		}
		else if (name == "D") {
			var variableOfDiffrentiation = getNodeString(node.children[0], funcID, currentVars);

			if(node.children[0].type != NODE_TYPE_VAR) {
				result.error = "first argumnet of differentiation function is not a variable";
			}

			childString = getDifferentialString(node.children[1], funcID, currentVars, node.children[0].value);

			result.body = childString.body;
			result.funcs = childString.funcs;
		}
		/*
		else if (strcmp(name, "integral") == 0) {
			char* prefixAddFuncName = "custom_math_func_";
			int numLen = (int)ceil(log10(fmax(*funcID, 1.2f)));
			char* numStr = malloc_c(g_log, sizeof(char) * (numLen + 1));
			sprintf(numStr, "%d", *funcID);

			*funcID = *funcID + 1;

			int addFunctionNameLen = strlen(numStr) + strlen(prefixAddFuncName);

			char* addFunctionName = malloc_c(g_log, sizeof(char) * (addFunctionNameLen + 1));
			strcat(addFunctionName, prefixAddFuncName);
			strcat(addFunctionName, numStr);

			char* integrationVar = "";
			char* integrationStart = "";
			char* integrationEnd = "";
			char* integrationDivisions = "";

			char* tempFuncString = "";

			if (node->children[0]->type == NODE_TYPE_VAR) {
				integrationVar = node->children[0]->value;
			} else {
				*pError = "Integration variable was not a variable!";
				return;
			}

			VarNode* tempVarNode = (VarNode*)malloc(sizeof(VarNode));
			tempVarNode->name = integrationVar;
			tempVarNode->id = currentVars->id + 1;
			tempVarNode->next = currentVars;

			getNodeString(node->children[1], &integrationStart, &tempFuncString, 0, funcID, currentVars, pError);
			getNodeString(node->children[2], &integrationEnd, &tempFuncString, 0, funcID, currentVars, pError);
			getNodeString(node->children[3], &integrationDivisions, &tempFuncString, 0, funcID, currentVars, pError);

			char* addVarArgs = "";
			char* addVarCall = "";

			VarNode* cVar = currentVars;
			for (int i = 0; i < currentVars->id - 6; i++) {
				addVarArgs = strConcat(addVarArgs, ", float ");
				addVarArgs = strConcat(addVarArgs, cVar->name);

				addVarCall = strConcat(addVarCall, ", ");
				addVarCall = strConcat(addVarCall, cVar->name);

				cVar = cVar->next;
			}

			char* pFuncName = "";

			getNodeString(node->children[4], &pFuncName, &tempFuncString, 0, funcID, tempVarNode, pError);

			char* addFunctionString = "float ";
			addFunctionString = strConcat(addFunctionString, addFunctionName);
			addFunctionString = strConcat(addFunctionString, "(float x, float y");
			addFunctionString = strConcat(addFunctionString, addVarArgs);
			addFunctionString = strConcat(addFunctionString, ") {\n");
			addFunctionString = strConcat(addFunctionString, "float result0_ = 0;\nfloat result1_ = 0;\n");
			addFunctionString = strConcat(addFunctionString, "float a_ = ");
			addFunctionString = strConcat(addFunctionString, integrationStart);
			addFunctionString = strConcat(addFunctionString, ";\n");
			addFunctionString = strConcat(addFunctionString, "float b_ = ");
			addFunctionString = strConcat(addFunctionString, integrationEnd);
			addFunctionString = strConcat(addFunctionString, ";\n");
			addFunctionString = strConcat(addFunctionString, "float n_ = ");
			addFunctionString = strConcat(addFunctionString, integrationDivisions);
			addFunctionString = strConcat(addFunctionString, ";\n");
			addFunctionString = strConcat(addFunctionString, "float dx_ = (b_ - a_)/n_;\n");
			addFunctionString = strConcat(addFunctionString, "float ");
			addFunctionString = strConcat(addFunctionString, integrationVar);
			addFunctionString = strConcat(addFunctionString, " = a_;\n");
			addFunctionString = strConcat(addFunctionString, "result0_ += ");
			addFunctionString = strConcat(addFunctionString, pFuncName);
			addFunctionString = strConcat(addFunctionString, ";\n");
			addFunctionString = strConcat(addFunctionString, integrationVar);
			addFunctionString = strConcat(addFunctionString, " = b_;\n");
			addFunctionString = strConcat(addFunctionString, "result0_ += ");
			addFunctionString = strConcat(addFunctionString, pFuncName);
			addFunctionString = strConcat(addFunctionString, ";\n");
			addFunctionString = strConcat(addFunctionString, "for(float k_ = 1; k_ < n_; k_++) {\n");
			addFunctionString = strConcat(addFunctionString, integrationVar);
			addFunctionString = strConcat(addFunctionString, " = a_+(k_*dx_);\n");
			addFunctionString = strConcat(addFunctionString, "result1_ += 2*");
			addFunctionString = strConcat(addFunctionString, pFuncName);
			addFunctionString = strConcat(addFunctionString, ";\n");
			addFunctionString = strConcat(addFunctionString, "}\n");
			addFunctionString = strConcat(addFunctionString, "return (dx_/2)*(result0_ + result1_);\n");
			addFunctionString = strConcat(addFunctionString, "\n}\n");

			*pFuncsString = strInsert(*pFuncsString, addFunctionString, 0);
			*pFuncsString = strInsert(*pFuncsString, tempFuncString, 0);

			*pString = strInsert(*pString, strConcat(strConcat(addFunctionName, "(x, y"), strConcat(addVarCall, ")")), pos);
		}

	*/

		if(childString.error) {
			result.error = childString.error;
		}
	}

	return result;
}

function getDifferentialString(node, funcID, currentVars, differentiationVar) {
		var result = new Object();
	result.body = "";
	result.funcs = "";

	if (node.type == NODE_TYPE_ZRO) {
		result.body = "0.0";
	}
	else if (node.type == NODE_TYPE_NUM) {
		result.body = "0.0";
	}
	else if (node.type == NODE_TYPE_VAR) {
		if(node.value == differentiationVar) {
			result.body = "1.0";
		} else {
			result.body = "0.0";
		}

		for(var i = 0; i < currentVars.length; i++) {
			if(currentVars[i] == node.value) {
				return result;
			}
		}

		result.error = "Unkown Variable: " + node.value;
	}
	else if (node.type == NODE_TYPE_OPP) {
		var prev = node.children[0];
		var post = node.children[1];

		if (node.value[0] == '+') {
			var prevString = getDifferentialString(prev, funcID, currentVars, differentiationVar);
			if(prevString.error) {
				result.error = prevString.error;
				return result;
			}

			var postString = getDifferentialString(post, funcID, currentVars, differentiationVar);
			if(postString.error) {
				result.error = postString.error;
				return result;
			}

			result.body = "(" + prevString.body + ")+(" + postString.body + ")";
			result.funcs = prevString.funcs + postString.funcs;
		}
		else if (node.value[0] == '-') {
			var prevString = getDifferentialString(prev, funcID, currentVars, differentiationVar);
			if(prevString.error) {
				result.error = prevString.error;
				return result;
			}

			var postString = getDifferentialString(post, funcID, currentVars, differentiationVar);
			if(postString.error) {
				result.error = postString.error;
				return result;
			}

			result.body = "(" + prevString.body + ")-(" + postString.body + ")";
			result.funcs = prevString.funcs + postString.funcs;
		}
		else if (node.value[0] == '*') {
			var prevString = getNodeString(prev, funcID, currentVars);
			if(prevString.error) {
				result.error = prevString.error;
				return result;
			}

			var postString = getNodeString(post, funcID, currentVars);
			if(postString.error) {
				result.error = postString.error;
				return result;
			}

			var prevStringD = getDifferentialString(prev, funcID, currentVars, differentiationVar);
			if(prevStringD.error) {
				result.error = prevStringD.error;
				return result;
			}

			var postStringD = getDifferentialString(post, funcID, currentVars, differentiationVar);
			if(postStringD.error) {
				result.error = postStringD.error;
				return result;
			}

			result.body = "(" + prevStringD.body + ")*(" + postString.body + ")+(" + prevString.body + ")*(" + postStringD.body + ")";
			result.funcs = prevString.funcs + postString.funcs + prevStringD.funcs + postStringD.funcs;
		}
		else if (node.value[0] == '/') {
			var prevString = getNodeString(prev, funcID, currentVars);
			if(prevString.error) {
				result.error = prevString.error;
				return result;
			}

			var postString = getNodeString(post, funcID, currentVars);
			if(postString.error) {
				result.error = postString.error;
				return result;
			}

			var prevStringD = getDifferentialString(prev, funcID, currentVars, differentiationVar);
			if(prevStringD.error) {
				result.error = prevStringD.error;
				return result;
			}

			var postStringD = getDifferentialString(post, funcID, currentVars, differentiationVar);
			if(postStringD.error) {
				result.error = postStringD.error;
				return result;
			}

			result.body = "((" + prevStringD.body + ")*(" + postString.body + ")-(" + prevString.body + ")*(" + postStringD.body + "))"
													 + "/pow_c(" + postString.body + ", 2.0)";
			result.funcs = prevString.funcs + postString.funcs + prevStringD.funcs + postStringD.funcs;
		}
		else if (node.value[0] == '^') {
			var prevString = getNodeString(prev, funcID, currentVars);
			if(prevString.error) {
				result.error = prevString.error;
				return result;
			}

			var postString = getNodeString(post, funcID, currentVars);
			if(postString.error) {
				result.error = postString.error;
				return result;
			}

			var prevStringD = getDifferentialString(prev, funcID, currentVars, differentiationVar);
			if(prevStringD.error) {
				result.error = prevStringD.error;
				return result;
			}

			var postStringD = getDifferentialString(post, funcID, currentVars, differentiationVar);
			if(postStringD.error) {
				result.error = postStringD.error;
				return result;
			}

			result.body = "((" + postStringD.body + ")*log(" + prevString.body + ")" + 
										"+(" + postString.body + ")*(" + prevStringD.body + ")/(" + prevString.body + "))"
									 + "*pow_c(" + prevString.body + "," + postString.body + ")";
			result.funcs = prevString.funcs + postString.funcs + prevStringD.funcs + postStringD.funcs;
		}

	}
	else if (node.type == NODE_TYPE_FFN) {
		var name = node.value;
		var childString = "";

		if (name == null) {
			childString = getDifferentialString(node.children[0], funcID, currentVars, differentiationVar);
			result.body = childString.body;
			result.funcs = childString.funcs;
		}
		else if (name == "sqrt") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			var childStringD = getDifferentialString(node.children[0], funcID, currentVars, differentiationVar);

			if(childStringD.error) {
				result.error = childStringD.error;
			}

			result.body = "(" + childStringD.body + ")/(2.0*sqrt(" + childString.body + "))";
			result.funcs = childString.funcs + childStringD.funcs;
		}
		else if (name == "ln") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			var childStringD = getDifferentialString(node.children[0], funcID, currentVars, differentiationVar);

			if(childStringD.error) {
				result.error = childStringD.error;
			}

			result.body = "(" + childStringD.body + ")/(" + childString.body + ")";
			result.funcs = childString.funcs + childStringD.funcs;
		}
		else if (name == "log") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			var childStringD = getDifferentialString(node.children[0], funcID, currentVars, differentiationVar);

			if(childStringD.error) {
				result.error = childStringD.error;
			}

			result.body = "(((" + childStringD.body + ")/(" + childString.body + "))/log(10.0))";
			result.funcs = childString.funcs + childStringD.funcs;
		}
		else if (name == "sin") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			var childStringD = getDifferentialString(node.children[0], funcID, currentVars, differentiationVar);

			if(childStringD.error) {
				result.error = childStringD.error;
			}

			result.body = "(" + childStringD.body + ")*cos_c(" + childString.body + ")";
			result.funcs = childString.funcs + childStringD.funcs;
		}
		else if (name == "cos") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			var childStringD = getDifferentialString(node.children[0], funcID, currentVars, differentiationVar);

			if(childStringD.error) {
				result.error = childStringD.error;
			}

			result.body = "-(" + childStringD.body + ")*sin_c(" + childString.body + ")";
			result.funcs = childString.funcs + childStringD.funcs;
		}
		else if (name == "tan") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			var childStringD = getDifferentialString(node.children[0], funcID, currentVars, differentiationVar);

			if(childStringD.error) {
				result.error = childStringD.error;
			}

			result.body = "(" + childStringD.body + ")/(pow_c(cos_c(" + childString.body + "), 2.0))";
			result.funcs = childString.funcs + childStringD.funcs;
		}
		/*
		else if (name == "asin") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "asin_c(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "acos") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "acos_c(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "atan") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "atan(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "cot") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "(1.0/tan(" + childString.body + "))";
			result.funcs = childString.funcs;
		}
		else if (name == "csc") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "(1.0/sin(" + childString.body + "))";
			result.funcs = childString.funcs;
		}
		else if (name == "sec") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "(1.0/cos(" + childString.body + "))";
			result.funcs = childString.funcs;
		}
		else if (name == "acot") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "acot_c(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "acsc") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "asin_c(1.0/(" + childString.body + "))";
			result.funcs = childString.funcs;
		}
		else if (name == "asec") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "acos_c(1.0/(" + childString.body + "))";
			result.funcs = childString.funcs;
		}
		else if (name == "pow") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			result.body = "pow_c(" + childString.body + ")";
			result.funcs = childString.funcs;
		}
		else if (name == "min") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			var secondString = getNodeString(node.children[1], funcID, currentVars);

			if(secondString.error) {
				result.error = secondString.error;
			}

			result.body = "min(" + childString.body + "," + secondString.body + ")";
			result.funcs = childString.funcs + secondString.funcs;
		}
		else if (name == "max") {
			childString = getNodeString(node.children[0], funcID, currentVars);
			var secondString = getNodeString(node.children[1], funcID, currentVars);

			if(secondString.error) {
				result.error = secondString.error;
			}

			result.body = "max(" + childString.body + "," + secondString.body + ")";
			result.funcs = childString.funcs + secondString.funcs;
		}
		else if (name == "sigma") {
			var addFunctionName = "custom_math_func_" + funcID.ID;

			funcID.ID = funcID.ID + 1;

			var incName = "";

			if (node.children[0].type == NODE_TYPE_VAR) {
				incName = node.children[0].value;
			} else {
				result.error = "Increment argument of sigma function was not a variable!";
				return result;
			}

			var newCurrentVars = currentVars.slice(0);
			newCurrentVars.push(incName);

			var arg1 = getNodeString(node.children[1], funcID, newCurrentVars);
			if(arg1.error) {
				result.error = arg1.error;
				return result;
			}

			var arg2 = getNodeString(node.children[2], funcID, newCurrentVars);
			if(arg2.error) {
				result.error = arg2.error;
				return result;
			}

			var addVarArgs = "";
			var addVarCall = "";

			for (var i = 6; i < currentVars.length; i++) {
				var cVar = currentVars[i];

				addVarArgs += ", float ";
				addVarArgs +=  cVar.name;

				addVarCall += ", ";
				addVarCall += cVar.name;
			}

			var formula = getNodeString(node.children[3], funcID, newCurrentVars);
			if(formula.error) {
				result.error = formula.error;
				return result;
			}

			var addFunctionString = 
				"float "+ addFunctionName + "(float x, float y" + addVarArgs + `) {
					float result = 0.0;
					for(float ` + incName + " = " + arg1.body + "; "+ incName + " <= " + arg2.body + "; " + incName + `+=1.0) {
						result += ` + formula.body + `;
					}
					return result; 
				}`;

			result.funcs = arg1.funcs + arg2.funcs + formula.funcs + addFunctionString;
			result.body = addFunctionName + "(x, y" + addVarCall + ")";
		}
		else if (name == "D") {
			var variableOfDiffrentiation = getNodeString(node.children[0], funcID, currentVars);

			if(node.children[0].type != NODE_TYPE_VAR) {
				result.error = "first argumnet of differentiation function is not a variable";
			}

			childString = getDifferentialString(node.children[1], funcID, currentVars, node.children[0].value);

			result.body = childString.body;
			result.funcs = childString.funcs;
		}
		*/

		if(childString.error) {
			result.error = childString.error;
		}
	}

	return result;
}


